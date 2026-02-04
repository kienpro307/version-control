import { Book, Key, Server, Zap, Workflow, AlertTriangle, MessageSquare } from 'lucide-react';

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-b border-white/10">
                <div className="max-w-5xl mx-auto px-6 py-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg backdrop-blur-sm border border-emerald-500/30">
                            <Book className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 font-semibold tracking-wide uppercase text-xs">Developer & Agent Hub</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 tracking-tight">My Version Manager API</h1>
                    <p className="text-slate-300 text-xl max-w-3xl leading-relaxed">
                        The definitive interface for AI Agents to autonomously manage project lifecycles.
                        Designed for self-healing workflows, automated changelog tracking, and seamless context synchronization.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-12 gap-10">

                {/* Sidebar Navigation */}
                <div className="col-span-3 hidden lg:block">
                    <div className="sticky top-8 space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Core Concepts</h3>
                            <nav className="space-y-1">
                                <NavLink href="#introduction">Introduction</NavLink>
                                <NavLink href="#authentication">Authentication</NavLink>
                                <NavLink href="#agent-workflow">Agent Workflow Strategy</NavLink>
                            </nav>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">API Reference</h3>
                            <nav className="space-y-1">
                                <NavLink href="#groups">Project Groups</NavLink>
                                <NavLink href="#projects">Projects</NavLink>
                                <NavLink href="#versions">Versions</NavLink>
                                <NavLink href="#tasks">Tasks</NavLink>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-12 lg:col-span-9 space-y-16">

                    {/* Introduction */}
                    <section id="introduction">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <Zap className="w-8 h-8 text-amber-500" />
                            For AI Agents: Read This First
                        </h2>
                        <div className="prose prose-slate max-w-none text-slate-600">
                            <p className="text-lg">
                                Hello Agent. This API is your control plane for the &quot;My Version Manager&quot; system.
                                Your goal is to maintain a perfect synchronization between the codebase state and this tracking system.
                            </p>
                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
                                <h4 className="font-bold text-amber-800 m-0 mb-1">💡 Prime Directive</h4>
                                <p className="m-0 text-amber-700">
                                    Whenever you complete a unit of work (feature, fix, refactor), you <strong>MUST</strong> log it as a Task.
                                    If you are about to start a major refactor or release, you <strong>MUST</strong> check the active Version first.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Authentication */}
                    <section id="authentication">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <Key className="w-6 h-6 text-blue-500" />
                            Authentication & Config
                        </h2>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-600 mb-4">
                                Include the <code className="text-blue-600 font-mono">Authorization</code> header in every request.
                            </p>
                            <CodeBlock
                                code={`Authorization: Bearer <API_SECRET_KEY>`}
                            />
                            <div className="mt-4 text-sm text-slate-500">
                                Key location: <code className="bg-slate-100 px-1 rounded">.env.local</code> → <code className="text-slate-700">API_SECRET_KEY</code>
                            </div>
                        </div>
                    </section>

                    {/* Workflow Strategy - NEW SECTION */}
                    <section id="agent-workflow">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <Workflow className="w-6 h-6 text-purple-600" />
                            Agent Workflow Strategy
                        </h2>

                        <div className="space-y-6">
                            <WorkflowCard
                                title="Scenario A: Starting a New Session"
                                description="When the user asks you to start working on a project:"
                                steps={[
                                    "SEARCH: Call GET /api/projects?search=name to find the project ID.",
                                    "CONTEXT: Call GET /api/projects/:id/versions to find the active version.",
                                    "STATUS: Call GET /api/projects/:id/tasks?status=pending to see what's left to do."
                                ]}
                            />

                            <WorkflowCard
                                title="Scenario B: Completing a Task"
                                description="When you finish a coding task:"
                                steps={[
                                    "LOG: Call POST /api/projects/:id/tasks with content='Implemented X feature'.",
                                    "MARK: Immediately call PATCH /api/tasks/:id with isDone=true.",
                                    "VERIFY: Double check if this completes the milestone defined in the active version."
                                ]}
                            />

                            <WorkflowCard
                                title="Scenario C: Releasing a Version"
                                description="When the user says 'Release this' or 'Deploy v2':"
                                steps={[
                                    "CREATE: Call POST /api/projects/:id/versions with { name: 'v2.0.0', migratePendingTasks: true }.",
                                    "EXPLAIN: Inform the user that pending tasks have been migrated to the new version."
                                ]}
                            />
                        </div>
                    </section>

                    <div className="h-px bg-slate-200 my-8" />

                    {/* Endpoints Reference */}
                    <section id="endpoints">
                        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                            <Server className="w-6 h-6 text-slate-500" />
                            API Reference
                        </h2>

                        {/* Groups */}
                        <div id="groups" className="mb-12">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800">1. Project Groups</h3>
                                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-mono">Hierarchical</span>
                            </div>
                            <p className="text-slate-600 mb-4">Use groups to organize projects (e.g., &quot;Client Work&quot;, &quot;Open Source&quot;). Supports infinite nesting.</p>
                            <div className="space-y-4">
                                <Endpoint
                                    method="GET"
                                    path="/api/groups"
                                    desc="Get full group tree. Use this to help the user navigate or categorize a new project."
                                />
                                <Endpoint
                                    method="POST"
                                    path="/api/groups"
                                    desc="Create a new category."
                                    body={`{ "name": "Mobile Apps", "parentId": "uuid-optional" }`}
                                />
                            </div>
                        </div>

                        {/* Projects */}
                        <div id="projects" className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">2. Projects</h3>
                            <div className="space-y-4">
                                <Endpoint
                                    method="GET"
                                    path="/api/projects"
                                    desc="List all projects. Filter by ?groupId=uuid to narrow down context."
                                />
                                <Endpoint
                                    method="POST"
                                    path="/api/projects"
                                    desc="Initialize a new project tracking container."
                                    body={`{ "name": "Super App", "groupId": "uuid-optional" }`}
                                />
                            </div>
                        </div>

                        {/* Versions */}
                        <div id="versions" className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">3. Versions (Milestones)</h3>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-4 text-sm text-blue-800 flex gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                <div>
                                    <strong>Critical Logic:</strong> Only one version is &quot;active&quot; at a time. Creating a new version automatically deactivates the old one. Use <code>migratePendingTasks: true</code> to carry over unfinished work.
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Endpoint
                                    method="GET"
                                    path="/api/projects/:id/versions"
                                    desc="List version history. The one with isActive=true is the current focus."
                                />
                                <Endpoint
                                    method="POST"
                                    path="/api/projects/:id/versions"
                                    desc="Cut a new release or start a sprint."
                                    body={`{ "name": "v1.2.0", "migratePendingTasks": true }`}
                                />
                            </div>
                        </div>

                        {/* Tasks */}
                        <div id="tasks" className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">4. Tasks (Work Items)</h3>
                            <div className="space-y-4">
                                <Endpoint
                                    method="GET"
                                    path="/api/projects/:id/tasks"
                                    desc="Fetch work items. Use ?status=pending to find what needs to be done."
                                />
                                <Endpoint
                                    method="POST"
                                    path="/api/projects/:id/tasks"
                                    desc="Log a work item. If versionId is omitted, it auto-links to the ACTIVE version."
                                    body={`{ "content": "Refactor auth middleware" }`}
                                />
                                <Endpoint
                                    method="PATCH"
                                    path="/api/tasks/:id"
                                    desc="Update status or refine description."
                                    body={`{ "isDone": true }`}
                                />
                            </div>
                        </div>

                    </section>

                    {/* Self-Prompting Section */}
                    <section id="prompt-template" className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-emerald-400" />
                            System Prompt Template
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Paste this into your other AI Agent&apos;s system instructions to give it full awareness of this tool.
                        </p>

                        <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto border border-white/10">
                            <pre>{`Tool: MyVersionManager
BaseURL: https://your-domain.com/api
Auth: Bearer Token (ENV: MVM_API_KEY)

Capabilities:
- Manage Projects, Versions, and Tasks.
- "Active Version" implies the current sprint/release cycle.

Standard Procedure:
1. Start of session: Check active version and pending tasks for current project.
2. Coding: Implement features/fixes.
3. End of task: Create a task via API describing the work and mark it as done.
4. Release: Create new version via API when major milestones are reached.`}</pre>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}

// Sub-components

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a href={href} className="block px-3 py-1.5 text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
            {children}
        </a>
    );
}

function WorkflowCard({ title, description, steps }: { title: string; description: string; steps: string[] }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-600 text-sm mb-4">{description}</p>
            <ul className="space-y-3">
                {steps.map((step, i) => {
                    const [prefix, text] = step.split(': ');
                    return (
                        <li key={i} className="text-sm flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-mono text-xs font-bold ring-1 ring-slate-200">
                                {i + 1}
                            </span>
                            <span className="text-slate-600">
                                <strong className="text-slate-800 font-semibold text-xs tracking-wide">{prefix}</strong>
                                <span className="block mt-0.5">{text}</span>
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function CodeBlock({ code }: { code: string }) {
    return (
        <div className="relative group">
            <pre className="bg-slate-900 text-slate-200 rounded-lg p-4 text-sm overflow-x-auto font-mono border border-slate-800">
                {code}
            </pre>
        </div>
    );
}

function Endpoint({ method, path, desc, body }: { method: string; path: string; desc: string; body?: string }) {
    const methodColors: Record<string, string> = {
        GET: 'bg-emerald-100 text-emerald-800 ring-emerald-500/20',
        POST: 'bg-blue-100 text-blue-800 ring-blue-500/20',
        PATCH: 'bg-amber-100 text-amber-800 ring-amber-500/20',
        DELETE: 'bg-red-100 text-red-800 ring-red-500/20',
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="p-4">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold ring-1 ring-inset ${methodColors[method]}`}>
                        {method}
                    </span>
                    <code className="text-sm text-slate-700 font-bold font-mono">{path}</code>
                </div>
                <p className="text-slate-600 text-sm">{desc}</p>

                {body && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payload Example</div>
                        <code className="block bg-slate-50 text-slate-600 p-2 rounded text-xs font-mono break-all">
                            {body}
                        </code>
                    </div>
                )}
            </div>
        </div>
    );
}
