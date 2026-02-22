import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            email: string;
            fullName: string;
            status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
            isAdmin: boolean;
            mfaEnabled: boolean;
            mfaVerified: boolean;
            licenseNumber: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        id: string;
        fullName: string;
        status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
        isAdmin: boolean;
        mfaEnabled: boolean;
        mfaVerified: boolean;
        licenseNumber: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        fullName: string;
        status: "PENDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE";
        isAdmin: boolean;
        mfaEnabled: boolean;
        mfaVerified: boolean;
        licenseNumber: string;
    }
}
