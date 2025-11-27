// This file contains all the paths of the directories and files
// used in the application
import path from "path";

export const ROOT = path.resolve(process.cwd());

export const resolveFromRoot = (...segments: string[]) =>
    path.join(ROOT, ...segments);

export const PathRepo = {
    root: ROOT,

    src: (...x: string[]) => resolveFromRoot("src", ...x),
    config: (...x: string[]) => resolveFromRoot("src", "config", ...x),
    internalTool: (...x: string[]) => resolveFromRoot("src", "internalTool", ...x),
    io: (...x: string[]) => resolveFromRoot("src", "io", ...x),
    output: (...x: string[]) => resolveFromRoot("src", "output", ...x),
    producers: (...x: string[]) => resolveFromRoot("src", "producers", ...x),
    resources: (...x: string[]) => resolveFromRoot("src", "resources", ...x),
    scrapers: (...x: string[]) => resolveFromRoot("src", "scrapers", ...x),
    utils: (...x: string[]) => resolveFromRoot("src", "utils", ...x),
};
