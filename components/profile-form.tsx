"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyStreet: string;
  companyZip: string;
  companyCity: string;
  companyCountry: string;
  billingDifferent: boolean;
  billingCompanyName: string;
  billingStreet: string;
  billingZip: string;
  billingCity: string;
  billingCountry: string;
};

const emptyProfile: ProfileData = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  companyStreet: "",
  companyZip: "",
  companyCity: "",
  companyCountry: "",
  billingDifferent: false,
  billingCompanyName: "",
  billingStreet: "",
  billingZip: "",
  billingCity: "",
  billingCountry: "",
};

export function ProfileForm() {
  const t = useTranslations("Profile");
  const tc = useTranslations("Common");

  const [data, setData] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((profile) => {
        setData(profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof ProfileData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal data */}
      <Card>
        <CardHeader>
          <CardTitle>{t("personalData")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{tc("name")}</Label>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={t("phonePlaceholder")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company address */}
      <Card>
        <CardHeader>
          <CardTitle>{t("companyAddress")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">{t("companyName")}</Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder={t("companyNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyStreet">{t("street")}</Label>
            <Input
              id="companyStreet"
              value={data.companyStreet}
              onChange={(e) => handleChange("companyStreet", e.target.value)}
              placeholder={t("streetPlaceholder")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="companyZip">{t("zip")}</Label>
              <Input
                id="companyZip"
                value={data.companyZip}
                onChange={(e) => handleChange("companyZip", e.target.value)}
                placeholder={t("zipPlaceholder")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="companyCity">{t("city")}</Label>
              <Input
                id="companyCity"
                value={data.companyCity}
                onChange={(e) => handleChange("companyCity", e.target.value)}
                placeholder={t("cityPlaceholder")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyCountry">{t("country")}</Label>
            <Input
              id="companyCountry"
              value={data.companyCountry}
              onChange={(e) => handleChange("companyCountry", e.target.value)}
              placeholder={t("countryPlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing address */}
      <Card>
        <CardHeader>
          <CardTitle>{t("billingAddress")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="billingDifferent"
              checked={data.billingDifferent}
              onCheckedChange={(checked) =>
                handleChange("billingDifferent", checked === true)
              }
            />
            <Label htmlFor="billingDifferent" className="cursor-pointer">
              {t("billingDifferentLabel")}
            </Label>
          </div>

          {data.billingDifferent && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="billingCompanyName">{t("companyName")}</Label>
                <Input
                  id="billingCompanyName"
                  value={data.billingCompanyName}
                  onChange={(e) =>
                    handleChange("billingCompanyName", e.target.value)
                  }
                  placeholder={t("companyNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingStreet">{t("street")}</Label>
                <Input
                  id="billingStreet"
                  value={data.billingStreet}
                  onChange={(e) =>
                    handleChange("billingStreet", e.target.value)
                  }
                  placeholder={t("streetPlaceholder")}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="billingZip">{t("zip")}</Label>
                  <Input
                    id="billingZip"
                    value={data.billingZip}
                    onChange={(e) =>
                      handleChange("billingZip", e.target.value)
                    }
                    placeholder={t("zipPlaceholder")}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="billingCity">{t("city")}</Label>
                  <Input
                    id="billingCity"
                    value={data.billingCity}
                    onChange={(e) =>
                      handleChange("billingCity", e.target.value)
                    }
                    placeholder={t("cityPlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingCountry">{t("country")}</Label>
                <Input
                  id="billingCountry"
                  value={data.billingCountry}
                  onChange={(e) =>
                    handleChange("billingCountry", e.target.value)
                  }
                  placeholder={t("countryPlaceholder")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? tc("saving") : tc("save")}
        </Button>
        {success && (
          <p className="text-sm text-green-600">{t("saved")}</p>
        )}
      </div>
    </form>
  );
}
