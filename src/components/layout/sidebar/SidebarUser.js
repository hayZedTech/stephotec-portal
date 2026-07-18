"use client";

import ImageZoom from "@/components/ui/ImageZoom";

export default function SidebarUser({
    user,
    collapsed,
}) {

    const initials = user?.firstName && user?.lastName
        ? (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase()
        : user?.username
            ? user.username.charAt(0).toUpperCase()
            : "?";

    const role =
        user?.role === "ADMIN"
            ? "System Administrator"
            : "Student";

    return (
        <div className={`border-b p-4 ${
            user?.role === "ADMIN"
                ? "border-slate-800"
                : "border-purple-950"
        }`}>

            <div
                className={`flex items-center ${
                    collapsed
                        ? "justify-center"
                        : "gap-3"
                }`}
            >

                <ImageZoom
                    src={user?.role === "STUDENT" ? user?.profilePictureUrl : undefined}
                    alt={initials}
                    avatarProps={{
                        sx: {
                            width: 46,
                            height: 46,
                            bgcolor: user?.role === "ADMIN" ? "#2563eb" : "#7c3aed",
                            fontWeight: 700,
                        }
                    }}
                >
                    {initials}
                </ImageZoom>

                {!collapsed && (

                    <div className="min-w-0 flex-1">

                        <h3 className="truncate text-sm font-semibold text-white">
                            {user?.username}
                        </h3>

                        <p className="truncate text-xs text-slate-400">
                            {role}
                        </p>

                    </div>

                )}

            </div>

        </div>
    );
}
