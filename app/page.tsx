import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Gallery from '@/components/Gallery'
import WorldMap from '@/components/WorldMap'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'

export default function Page() {
  return (
    <main>
      <Nav />
      <Hero />
      <About />
      <Gallery />
      <WorldMap />
      <Contact />
      <Footer />
    </main>
  )
}
