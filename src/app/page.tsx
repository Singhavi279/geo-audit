import AuditForm from '@/components/AuditForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-page text-text-primary selection:bg-text-primary selection:text-surface-page">
      <main className="container mx-auto px-6 py-24 max-w-7xl">

        {/* Hero Section: Massive Typography & Negative Spacing */}
        <div className="text-center mb-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-blue-100/30 to-purple-100/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

          <span className="inline-block py-1.5 px-5 rounded-full bg-white/50 border border-white/60 backdrop-blur-md text-sm font-medium text-text-secondary mb-8 shadow-sm">
            🚀 The Standard for AI-First SEO
          </span>

          <h1 className="text-[80px] md:text-[100px] leading-[0.9] font-semibold tracking-tighter text-text-primary mb-10">
            Get Cited.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-tertiary">
              Be Visible.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed font-light tracking-wide mb-12">
            The first audit engine designed for the Generative Engine Optimization (GEO) era.
            We analyze the raw signals that determine if LLMs can <span className="font-medium text-text-primary">read</span>, <span className="font-medium text-text-primary">trust</span>, and <span className="font-medium text-text-primary">cite</span> your content.
          </p>

          {/* Audit Form Container */}
          <div className="glass-panel p-2 rounded-3xl shadow-2xl max-w-3xl mx-auto transform transition-transform hover:scale-[1.01] duration-500 ease-out-expo">
            <div className="bg-surface-card rounded-2xl p-8 border border-white/40">
              <AuditForm />
            </div>
          </div>
        </div>

        {/* Value Props: Glassmorphism Grid */}
        <div className="mb-32">
          <div className="flex items-end justify-between mb-12 px-4">
            <h2 className="text-4xl font-medium tracking-tighter text-text-primary max-w-lg">
              Why optimize for AI?
            </h2>
            <p className="text-text-tertiary text-right hidden md:block">
              LLMs function differently than<br />traditional search spiders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="group glass-panel p-10 rounded-3xl bg-surface-container-low/40 border border-white/20 hover:bg-white/60 transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-surface-container mb-6 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="text-2xl font-medium text-text-primary mb-3 tracking-tight">
                Indexability & Vectors
              </h3>
              <p className="text-text-secondary leading-relaxed">
                If an AI crawler cannot efficiently render and vector-embed your content, you simply don't exist in the model's knowledge base. We verify retrieval paths.
              </p>
            </div>

            <div className="group glass-panel p-10 rounded-3xl bg-surface-container-low/40 border border-white/20 hover:bg-white/60 transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-surface-container mb-6 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className="text-2xl font-medium text-text-primary mb-3 tracking-tight">
                Extractable Structure
              </h3>
              <p className="text-text-secondary leading-relaxed">
                LLMs cite pages that offer clean definitions, quotable spans, and structured data. We analyze your HTML for "machine-readability".
              </p>
            </div>

            <div className="group glass-panel p-10 rounded-3xl bg-surface-container-low/40 border border-white/20 hover:bg-white/60 transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-surface-container mb-6 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">🛡️</div>
              <h3 className="text-2xl font-medium text-text-primary mb-3 tracking-tight">
                Provenance & Trust
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Hallucination penalties are real. Models prefer sources with clear authorship, dates, and policy pages. We check your "Trust Signals".
              </p>
            </div>

            <div className="group glass-panel p-10 rounded-3xl bg-surface-container-low/40 border border-white/20 hover:bg-white/60 transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-surface-container mb-6 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">🚀</div>
              <h3 className="text-2xl font-medium text-text-primary mb-3 tracking-tight">
                Core Performance
              </h3>
              <p className="text-text-secondary leading-relaxed">
                Speed is a proxy for quality. Slow pages are often down-ranked in retrieval-augmented generation (RAG) pipelines. We benchmark against Core Web Vitals.
              </p>
            </div>
          </div>
        </div>

        {/* MVP Disclaimer */}
        <div className="text-center mb-24">
          <p className="text-sm font-mono text-text-tertiary uppercase tracking-widest opacity-60">
            GEO Audit MVP • v1.0.0 Alpha
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 pt-12 pb-12 flex flex-col md:flex-row justify-between items-center text-sm text-text-tertiary">
          <p>© 2024 Antigravity Audit. Built for the AI internet.</p>
          <div className="flex gap-6 mt-4 md:mt-0 font-medium">
            <a href="#" className="hover:text-text-primary transition-colors">Methodology</a>
            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
