import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Strip from "@/components/Strip";
import Treatments from "@/components/Treatments";
import FirstVisit from "@/components/FirstVisit";
import Dentists from "@/components/Dentists";
import BeforeYouVisit from "@/components/BeforeYouVisit";
import Footer from "@/components/Footer";
import { NoorProvider } from "@/components/noor/NoorProvider";
import NoorLauncher from "@/components/noor/NoorLauncher";

export default function Home() {
  return (
    <NoorProvider>
      <TopBar />
      <Header />
      <main>
        <Hero />
        <Strip />
        <Treatments />
        <FirstVisit />
        <Dentists />
        <BeforeYouVisit />
      </main>
      <Footer />
      <NoorLauncher />
    </NoorProvider>
  );
}
