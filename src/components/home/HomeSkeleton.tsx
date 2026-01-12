import { Skeleton } from "../ui/skeleton";

export const HomeSkeleton = () => {
    return (
        <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
            <div className="flex-1 flex flex-col overflow-y-auto pb-24 no-scrollbar">
                {/* 1. Header & Greeting Skeleton */}
                <header className="px-6 flex items-center justify-between pt-safe mt-4 mb-2">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-32 rounded-lg" />
                        <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                    <Skeleton className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                </header>

                {/* 2. Dominant Banner Skeleton */}
                <div className="px-6 mb-8 mt-2">
                    <Skeleton className="w-full aspect-[4/3] rounded-[2.5rem] shadow-sm" />
                </div>

                {/* 3. Service Grid Skeleton (Bento) */}
                <div className="px-6 mb-4">
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-3 gap-3">
                            <Skeleton className="col-span-2 h-[140px] rounded-[1.5rem]" />
                            <Skeleton className="col-span-1 h-[140px] rounded-[1.5rem]" />
                            <Skeleton className="col-span-1 h-[140px] rounded-[1.5rem]" />
                            <Skeleton className="col-span-2 h-[140px] rounded-[1.5rem]" />
                        </div>
                    </div>
                </div>

                {/* 4. Recent Activity Skeleton */}
                <div className="px-6 mt-2">
                    <Skeleton className="h-6 w-40 mb-4 rounded-md" />
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-24 w-full rounded-[1.2rem]" />
                        <Skeleton className="h-24 w-full rounded-[1.2rem]" />
                    </div>
                </div>
            </div>

            {/* 5. Fixed Footer Skeleton */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 flex gap-3 z-[1000] rounded-[2rem] border border-gray-100">
                <Skeleton className="flex-1 h-14 rounded-[1.5rem]" />
                <Skeleton className="flex-[1.5] h-14 rounded-[1.5rem]" />
            </div>
        </div>
    );
};
