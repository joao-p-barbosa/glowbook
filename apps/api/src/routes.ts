import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes";
import { tenantsRoutes } from "./modules/tenants/tenants.routes";
import { clientsRoutes } from "./modules/clients/clients.routes";
import { servicesRoutes } from "./modules/services/services.routes";
import { professionalsRoutes } from "./modules/professionals/professionals.routes";
import { appointmentsRoutes } from "./modules/appointments/appointments.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";
import { categoriesRoutes } from "./modules/categories/categories.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { rolesRoutes } from "./modules/roles/roles.routes";
import { plansRoutes } from "./modules/plans/plans.routes";
import { authMiddleware } from "./middlewares/authMiddleware";
import { tenantMiddleware } from "./middlewares/tenantMiddleware";

export const apiRouter = Router();

// público
apiRouter.get("/health", (_req, res) => res.json({ status: "ok" }));
apiRouter.use("/auth", authRoutes);
apiRouter.use("/plans", plansRoutes);

// protegido — exige usuário autenticado + tenant resolvido pelo backend
const protectedRouter = Router();
protectedRouter.use(authMiddleware, tenantMiddleware);
protectedRouter.use("/tenants", tenantsRoutes);
protectedRouter.use("/clients", clientsRoutes);
protectedRouter.use("/services", servicesRoutes);
protectedRouter.use("/categories", categoriesRoutes);
protectedRouter.use("/professionals", professionalsRoutes);
protectedRouter.use("/appointments", appointmentsRoutes);
protectedRouter.use("/users", usersRoutes);
protectedRouter.use("/roles", rolesRoutes);
protectedRouter.use("/settings", settingsRoutes);

apiRouter.use(protectedRouter);
