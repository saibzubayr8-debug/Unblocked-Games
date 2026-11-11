import React, { useState } from 'react';
import { FileText, BookOpen, Clock, Calendar, CheckCircle2, MoreVertical, Menu, Search, HelpCircle, Settings, Grid, ArrowLeft } from 'lucide-react';

interface PanicScreenProps {
  onDismiss: () => void;
}

export default function PanicScreen({ onDismiss }: PanicScreenProps) {
  const [fakeApp, setFakeApp] = useState<'classroom' | 'docs'>('classroom');

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-slate-900 font-sans select-text overflow-y-auto">
      {/* Secret dismiss bar at top right corner */}
      <div className="fixed top-2 right-2 z-[10000] flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setFakeApp(fakeApp === 'classroom' ? 'docs' : 'classroom')}
          className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded border border-slate-300"
        >
          Switch to {fakeApp === 'classroom' ? 'Google Docs' : 'Google Classroom'}
        </button>
        <button
          onClick={onDismiss}
          className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded shadow hover:bg-slate-900"
          title="Press ~ or Esc to return to games"
        >
          Exit Stealth Mode (Esc)
        </button>
      </div>

      {fakeApp === 'classroom' ? (
        /* FAKE GOOGLE CLASSROOM */
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                <span className="text-xl font-medium text-slate-700">Google Classroom</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600 hidden sm:block">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                <Grid className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                S
              </div>
            </div>
          </header>

          {/* Sub Navigation Banner */}
          <div className="max-w-5xl w-full mx-auto p-4 sm:p-6">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 sm:p-8 shadow-sm mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">AP World History - Period 3</h1>
              <p className="text-sm text-emerald-100">Mr. Henderson • Room 204 • Academic Year 2026-2027</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-emerald-900/60 px-3 py-1 rounded-md text-xs font-medium">
                <span>Class code: <strong className="tracking-wider">k8m4px2</strong></span>
              </div>
            </div>

            {/* Layout: Sidebar and Stream */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left upcoming box */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Upcoming</h3>
                  <p className="text-xs text-slate-500 mb-3">Due Friday, 11:59 PM</p>
                  <div className="text-xs text-emerald-700 font-medium hover:underline cursor-pointer mb-2">
                    Unit 4 DBQ Outline: Industrial Revolution & Global Trade
                  </div>
                  <div className="text-xs text-slate-400">Due Nov 15: Primary Source Annotations</div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">My Enrolled Classes</h3>
                  <ul className="text-xs space-y-2 text-slate-600">
                    <li className="flex items-center gap-2 text-emerald-700 font-medium cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" /> AP World History
                    </li>
                    <li className="flex items-center gap-2 hover:text-slate-900 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-blue-600" /> Honors English 11
                    </li>
                    <li className="flex items-center gap-2 hover:text-slate-900 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-amber-600" /> AP Chemistry
                    </li>
                    <li className="flex items-center gap-2 hover:text-slate-900 cursor-pointer">
                      <span className="w-2 h-2 rounded-full bg-purple-600" /> Pre-Calculus
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main Stream Posts */}
              <div className="md:col-span-3 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    S
                  </div>
                  <input
                    type="text"
                    placeholder="Announce something to your class..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-700 outline-none focus:bg-white focus:border-emerald-600"
                    readOnly
                  />
                </div>

                {/* Assignment Post */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">Mr. Henderson posted a new assignment: Unit 4 DBQ</div>
                        <div className="text-xs text-slate-400">Nov 8 • Due Friday at 11:59 PM</div>
                      </div>
                    </div>
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Please review the 7 attached primary source documents discussing the economic and geopolitical consequences of 19th-century industrialization. Formulate a defensible thesis statement and prepare your outline following the rubric distributed in class on Tuesday.
                  </p>
                  <div className="flex items-center gap-3 border border-slate-200 rounded-lg p-2.5 bg-slate-50 max-w-sm">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-700 truncate">AP_World_Unit4_DBQ_Sources.pdf</div>
                      <div className="text-[10px] text-slate-400">PDF Document • 2.4 MB</div>
                    </div>
                  </div>
                </div>

                {/* Announcement Post */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-semibold">
                      MH
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Mr. Henderson</div>
                      <div className="text-[10px] text-slate-400">Nov 5</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Reminder: Review session for our upcoming exam will be held in Room 204 tomorrow during lunch. Bring your textbook and study guide packets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FAKE GOOGLE DOCS */
        <div className="min-h-screen bg-slate-100 flex flex-col">
          {/* Docs Header */}
          <header className="bg-white border-b border-slate-200 px-4 py-2 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      defaultValue="AP Literature - Synthesis Essay on Modernist Poetry"
                      className="font-medium text-slate-800 text-sm border border-transparent hover:border-slate-300 rounded px-1 outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">Saved to Drive</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                    <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">File</span>
                    <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Edit</span>
                    <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">View</span>
                    <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Insert</span>
                    <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Format</span>
                    <span className="hover:bg-slate-100 px-1 rounded cursor-pointer">Tools</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="bg-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm hover:bg-blue-700">
                  Share
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  S
                </div>
              </div>
            </div>
          </header>

          {/* Docs Fake Paper */}
          <div className="flex-1 max-w-3xl w-full mx-auto my-6 bg-white shadow-md border border-slate-200 p-12 min-h-[750px] text-slate-800 leading-relaxed font-serif">
            <div className="text-right text-xs font-sans text-slate-500 mb-6">
              Student Name<br />
              Instructor: Dr. Vance<br />
              AP Literature & Composition<br />
              11 November 2026
            </div>

            <h1 className="text-center font-bold text-base mb-6 font-sans">
              Echoes of Alienation: Fragmentation and Disillusionment in 20th-Century Modernist Verse
            </h1>

            <p className="text-xs mb-4 text-justify indent-8">
              The early twentieth century witnessed profound societal upheaval as rapid industrialization, the trauma of the Great War, and technological alienation fundamentally destabilized classical paradigms of literature and philosophy. In response to this cultural fissure, Modernist poets rejected ornamental Victorian rhetoric in favor of fragmented syntax, multi-vocal juxtapositions, and jarring colloquialisms. Through these radical aesthetic departures, authors such as T.S. Eliot and Ezra Pound sought to capture the psychological dislocation experienced by urban dwellers within an increasingly commodified landscape.
            </p>

            <p className="text-xs mb-4 text-justify indent-8">
              Eliot's magnum opus, <em>The Waste Land</em>, epitomizes this technique by weaving disparate mythological archetypes with the mundane banality of contemporary London. Rather than presenting a coherent narrative arc, the speaker navigates a desolate terrain of spiritual sterility where "a heap of broken images" reflects the moral paralysis of postwar society. By denying the reader easy synthesis, Eliot mirrors the sensory overload and moral confusion intrinsic to modernity.
            </p>

            <p className="text-xs mb-4 text-justify indent-8">
              Similarly, the Imagist movement emphasized concise precision and visual clarity as an antidote to sentimental verbosity. Pound’s dictum to "make it new" urged contemporaries to strip away abstraction in pursuit of the direct treatment of the thing. Consequently, modern verse ceased to function merely as pastoral consolation, transforming instead into an acute analytical instrument for scrutinizing the human psyche under pressure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
