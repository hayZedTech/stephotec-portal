import AppProviders from "@/providers/AppProviders";
import "./globals.css";

export const metadata = {
    title: "Stephotec Academy",
    description: "Stephotec Computer Technologies Limited Portal",
    icons: {
        icon: "/logos/favco.png",
        shortcut: "/logos/favco.png",
        apple: "/logos/favco.png",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/logos/favco.png" type="image/png" />
                <link rel="apple-touch-icon" href="/logos/favco.png" />
            </head>
            <body>
                <AppProviders>
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
