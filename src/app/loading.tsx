import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
            <div className="relative">
                {/* Outer glowing ring */}
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 opacity-20 blur-lg animate-pulse"></div>

                {/* Inner spinner structure */}
                <div className="relative bg-white dark:bg-slate-900 rounded-full p-4 shadow-xl border border-slate-100 dark:border-slate-800">
                    <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-500 animate-spin" />
                </div>
            </div>

            <div className="opacity-0 animate-[fadeIn_0.5s_ease-out_0.5s_forwards] flex flex-col items-center">
                <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                    Loading
                </p>
                <div className="flex gap-1 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-emerald-500 animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-500 animate-[bounce_1s_infinite_400ms]"></div>
                </div>
            </div>
        </div>
    );
}
