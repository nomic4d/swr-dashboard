import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execFile } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { componentTagger } from "lovable-tagger";

const sendMail = (subject: string, body: string, to: string[]) =>
  new Promise<void>((resolve, reject) => {
    const bodyFile = join(tmpdir(), `swr-mail-${Date.now()}.txt`);
    writeFileSync(bodyFile, body, "utf8");
    const script = `on run argv
  set theSubject to item 1 of argv
  set bodyFile to item 2 of argv
  set theBody to read POSIX file bodyFile as «class utf8»
  set fromAddress to "asif@adb.org"
  tell application "Mail"
    set fromAccount to missing value
    repeat with acct in accounts
      try
        repeat with addr in (email addresses of acct)
          if (addr as string) is fromAddress then set fromAccount to acct
        end repeat
      end try
    end repeat
    if fromAccount is missing value then error "asif@adb.org Mail mein add nahi hai"
    set msg to make new outgoing message with properties {visible:false}
    set sender of msg to fromAddress
    set subject of msg to theSubject
    set content of msg to theBody
    tell msg
      repeat with i from 3 to (count of argv)
        make new to recipient at end of to recipients with properties {address:(item i of argv)}
      end repeat
      delay 1
      send
    end tell
  end tell
end run`;
    execFile("osascript", ["-e", script, subject, bodyFile, ...to], { timeout: 30000 }, (error, _stdout, stderr) => {
      try { unlinkSync(bodyFile); } catch { /* already gone */ }
      if (error) reject(new Error(stderr?.trim() || error.message));
      else resolve();
    });
  });

const localMail = (): Plugin => ({
  name: "local-mail",
  configureServer(server) {
    server.middlewares.use("/api/send-email", (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.end();
        return;
      }
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      req.on("end", async () => {
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
          const subject = String(payload.subject || "").trim();
          const body = String(payload.body || "").trim();
          const to = [...new Set((Array.isArray(payload.to) ? payload.to : []).map((item: unknown) => String(item).trim()))]
            .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
          if (!subject || !body || !to.length || to.length > 120) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Subject, message, aur kam az kam ek email chahiye." }));
            return;
          }
          await sendMail(subject, body, to);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ sent: to.length }));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Email nahi gayi" }));
        }
      });
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), localMail(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-switch", "@radix-ui/react-popover", "@radix-ui/react-dropdown-menu", "@radix-ui/react-avatar", "@radix-ui/react-toast"],
          query: ["@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
