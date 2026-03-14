import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Terminal, Play, Package, GitBranch } from "lucide-react";
import { useState } from "react";

export default function Documentation() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative bg-stone-900 rounded-lg p-3 sm:p-4 overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-stone-400 text-xs sm:text-sm">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code, id)}
          className="text-stone-400 hover:text-white p-1 min-w-0"
        >
          {copiedCode === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="text-stone-100 text-xs sm:text-sm overflow-x-auto">
        <code className="break-all sm:break-normal">{code}</code>
      </pre>
    </div>
  );



  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 custom-scrollbar space-y-6 sm:space-y-8">
      {/* Installation Guide */}
      <Card className="border border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-stone-900">
            <Package className="h-6 w-6" />
            Installation & Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Clone Repository
            </h3>
            <CodeBlock 
              code={`git clone https://github.com/themewagon/material-shadcn.git
cd material-shadcn`} 
              language="bash" 
              id="clone" 
            />
          </div>
          
          <div>
            <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Install Dependencies
            </h3>
            <CodeBlock 
              code={`npm install`} 
              language="bash" 
              id="install" 
            />
          </div>

          <div>
            <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Environment Setup
            </h3>
            <p className="text-stone-600 text-sm mb-2">Create a .env file in the root directory:</p>
            <CodeBlock 
              code={`DATABASE_URL="your-database-url"
NODE_ENV="development"`} 
              language="env" 
              id="env" 
            />
          </div>

          <div>
            <h3 className="font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Play className="h-4 w-4" />
              Run Development Server
            </h3>
            <CodeBlock 
              code={`npm run dev`} 
              language="bash" 
              id="dev" 
            />
            <p className="text-stone-600 text-sm mt-2">
              The application will be available at <code className="bg-stone-100 px-1 rounded">http://localhost:5000</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="border border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-stone-900">Technology Stack</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-stone-900">Frontend</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-stone-900">Backend</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Express.js</Badge>
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">Drizzle ORM</Badge>
                <Badge variant="secondary">PostgreSQL</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-stone-900">UI Components</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">shadcn/ui</Badge>
                <Badge variant="secondary">Radix UI</Badge>
                <Badge variant="secondary">Lucide Icons</Badge>
                <Badge variant="secondary">Recharts</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Project Structure */}
      <Card className="border border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-stone-900">Project Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock 
            code={`project-root/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── dashboard/  # Dashboard-specific components
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Application pages/routes
│   │   ├── lib/            # Utility functions and configs
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express.js application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database storage interface
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schemas and types
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── drizzle.config.ts       # Database configuration`}
            language="text"
            id="structure"
          />
        </CardContent>
      </Card>

      {/* Build Commands */}
      <Card className="border border-stone-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-stone-900">Build & Deployment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">Development</h4>
            <CodeBlock code="npm run dev" language="bash" id="dev-build" />
          </div>
          
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">Production Build</h4>
            <CodeBlock code="npm run build" language="bash" id="prod-build" />
          </div>
          
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">Start Production Server</h4>
            <CodeBlock code="npm start" language="bash" id="start-prod" />
          </div>
          
          <div>
            <h4 className="font-semibold text-stone-900 mb-2">Database Operations</h4>
            <CodeBlock 
              code={`npm run db:push     # Apply schema changes
npm run db:studio   # Open Drizzle Studio`} 
              language="bash" 
              id="db-commands" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}