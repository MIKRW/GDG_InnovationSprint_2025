import BirdLogClient from "@/components/chirp-id/BirdLogClient";

export default function BirdLogPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-headline">My Bird Log</h1>
            </div>
            <BirdLogClient />
        </div>
    );
}
