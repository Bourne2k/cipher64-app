import { Link } from "@tanstack/react-router";

function NoDatabaseWarning() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <p className="mb-2">No reference database found or selected.</p>
            <p>
                Please{" "}
                <Link to="/databases" className="text-primary hover:underline font-medium">
                    select a database
                </Link>{" "}
                to view opening statistics and reference games.
            </p>
        </div>
    );
}

export default NoDatabaseWarning;