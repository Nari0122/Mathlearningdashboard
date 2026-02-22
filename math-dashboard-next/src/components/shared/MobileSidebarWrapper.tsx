"use client";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MobileSidebarWrapperProps {
    children: React.ReactNode;
}

export function MobileSidebarWrapper({ children }: MobileSidebarWrapperProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button
                    type="button"
                    className="min-h-[44px] min-w-[44px] p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer touch-manipulation flex items-center justify-center"
                    aria-label="메뉴 열기"
                >
                    <Menu size={24} />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
                <SheetTitle className="sr-only">모바일 메뉴</SheetTitle>
                <div className="h-full w-full">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    );
}
