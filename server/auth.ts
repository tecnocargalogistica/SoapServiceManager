import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { DatabaseStorage } from "./db-storage";
import { Usuario } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends Usuario {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express, storage: DatabaseStorage) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.activo) {
          return done(null, false, { message: "Usuario o contraseña incorrectos" });
        }
        
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Usuario o contraseña incorrectos" });
        }

        // Actualizar último acceso
        await storage.updateUsuario(user.id, { ultimo_acceso: new Date() });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Ruta de registro
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, nombre, email, rol } = req.body;
      
      if (!username || !password || !nombre) {
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "El nombre de usuario ya existe" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        nombre,
        email,
        rol: rol || "usuario",
        activo: true
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        });
      });
    } catch (error) {
      console.error("Error en registro:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Ruta de login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Credenciales inválidas" });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Error interno del servidor" });
        }
        
        res.json({
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        });
      });
    })(req, res, next);
  });

  // Ruta de logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.json({ message: "Sesión cerrada correctamente" });
      });
    });
  });

  // Ruta para obtener usuario actual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "No autenticado" });
    }
    
    const user = req.user as Usuario;
    res.json({
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol
    });
  });
}

// Middleware para proteger rutas
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Acceso no autorizado" });
  }
  next();
}

// Middleware para requerir rol de administrador
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Acceso no autorizado" });
  }
  
  const user = req.user as Usuario;
  if (user.rol !== "admin") {
    return res.status(403).json({ error: "Acceso denegado - Se requiere rol de administrador" });
  }
  
  next();
}

// Export hashPassword function for creating new users
export { hashPassword };