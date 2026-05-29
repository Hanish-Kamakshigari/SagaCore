import Hero from './components/Hero'
import LandingSections from './components/LandingSections'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-purple-500/30 selection:text-purple-200">
      <Hero />
      <LandingSections />
    </main>
  )
}