import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ProfileForm />
    </div>
  );
}
