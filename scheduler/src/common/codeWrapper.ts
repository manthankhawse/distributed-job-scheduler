export const wrapCode = (runtime: string, userCode: string): string => {
    switch (runtime) {
        case 'node:18':
            return `
const fs = require('fs');
const APP_PATH = '/app';

// ---------------- USER CODE STARTS ----------------
${userCode}
// ---------------- USER CODE ENDS ------------------

(async () => {
    try {
        let payload = {};
        const payloadPath = APP_PATH + '/payload.json';
        if (fs.existsSync(payloadPath)) {
            payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
        }

        // 🟢 FIX: Pass the FULL payload. 
        // User accesses global state via 'payload.context'
        // User accesses args via 'payload.myArg'
        const output = await handler(payload);

        if (output) {
            fs.writeFileSync(APP_PATH + '/output.json', JSON.stringify(output));
        }
    } catch (err) {
        console.error("❌ Job Wrapper Error:", err);
        process.exit(1);
    }
})();`;

        case 'python:3.9':
            return `
import json
import os
import sys

# ---------------- USER CODE STARTS ----------------
${userCode}
# ---------------- USER CODE ENDS ------------------

if __name__ == "__main__":
    try:
        payload = {}
        payload_path = "/app/payload.json"
        
        if os.path.exists(payload_path):
            with open(payload_path, "r") as f:
                payload = json.load(f)
        
        # 🟢 FIX: Pass the FULL payload directly
        output = handler(payload)
        
        if output is not None:
            with open("/app/output.json", "w") as f:
                json.dump(output, f)
                
    except Exception as e:
        print(f"❌ Job Wrapper Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
`;
        default:
            return userCode;
    }
};