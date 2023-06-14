import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import * as glob from "glob";
import dotenv from "dotenv";
import { build } from "vite";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = glob
  .sync("src/api/**/*.ts")
  // Filter out private files
  .filter((file) => {
    return file.indexOf("_") !== 0 && file.indexOf("/_") === -1;
  })
  .map((file: string) => ({
    entry: `./${file}`,
    distFileName: file.replace("src/api/", "").replace(".ts", ""),
  }));

(async () => {
  for (const file of files) {
    await build({
      ssr: {
        noExternal: fs
          .readdirSync(path.join(__dirname, "node_modules"), {
            withFileTypes: true,
          })
          .filter(
            (dirent) =>
              // Filter out if the directory does not start with a dot
              dirent.isDirectory() &&
              !dirent.name.startsWith(".") &&
              // sqlite3 is using aws-sdk which increases the bundle significantly
              // since it's designed for local development, ignore this.
              ["sqlite3"].indexOf(dirent.name) > -1
          )
          .map((dirent) => new RegExp(dirent.name)),
      },
      configFile: false,
      resolve: {
        alias: [
          {
            find: /^~/,
            replacement: path.resolve(__dirname, "src"),
          },
          {
            find: /^sqlite3$/,
            replacement: path.resolve(
              __dirname,
              "node_modules/sqlite3/lib/sqlite3.js"
            ),
          },
        ],
        extensions: [".ts", ".tsx"],
      },
      define: {
        ...Object.keys(process.env).reduce(
          (obj: Record<string, string>, key: string) => {
            obj[`process.env.${key}`] = JSON.stringify(process.env[key]);
            return obj;
          },
          {}
        ),
      },
      build: {
        ssr: true,
        emptyOutDir: false,
        copyPublicDir: false,
        rollupOptions: {
          input: {
            [file.distFileName]: file.entry,
          },
          output: {
            dir: ".stormkit/api",
            format: "cjs",
            manualChunks: () => "",
          },
        },
        minify: false,
      },
    });
  }
})();
