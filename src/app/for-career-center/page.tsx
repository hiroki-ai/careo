import CareerCenterLandingPage from "@/components/landing/CareerCenterLandingPage";

export const metadata = {
  title: "大学キャリアセンター担当者の方へ | Careo",
  description:
    "CareoはAI就活コーチアプリです。大学との提携により、学生の就活状況を可視化し、面談の質を高め、支援の成果を証明できます。費用は一切かかりません。",
  openGraph: {
    title: "大学キャリアセンター担当者の方へ | Careo",
    description:
      "Careoと提携することで、学生の就活データを把握し、孤立した学生に届き、支援の成果を数字で証明できます。",
  },
};

export default function ForCareerCenterPage() {
  return <CareerCenterLandingPage />;
}
