import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = { title: "Arbitrage Tracker" };

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-background text-foreground">
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 overflow-auto">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
