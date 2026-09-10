import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile
} from "../services/profileApi";

import "../styles/profile.css";

const occupationOptions = [
  { value: "student", label: "Student" },
  { value: "professional", label: "Professional" },
  { value: "teacher", label: "Teacher" }
];

const domainOptions = [
  {
    value: "computer_science_it",
    label: "Computer Science & IT",
  },
  {
    value: "business_management",
    label: "Business & Management",
  },
  {
    value: "finance_banking",
    label: "Finance & Banking",
  },
  {
    value: "commerce_accounting",
    label: "Commerce & Accounting",
  },
  {
    value: "marketing_sales_customer_service",
    label: "Marketing, Sales & Customer Service",
  },
  {
    value: "human_resources",
    label: "Human Resources",
  },
  {
    value: "operations_supply_chain",
    label: "Operations & Supply Chain",
  },
  {
    value: "science_research",
    label: "Science & Research",
  },
  {
    value: "agribusiness",
    label: "Agribusiness",
  },
  {
    value: "food_technology",
    label: "Food Technology",
  },
  {
    value: "healthcare",
    label: "Healthcare",
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
  },
  {
    value: "law_legal_services",
    label: "Law / Legal Services",
  },
  {
    value: "media_journalism",
    label: "Media & Journalism",
  },
  {
    value: "ui_ux_design",
    label: "UI/UX Design",
  },
  {
    value: "architecture",
    label: "Architecture",
  },
  {
    value: "education_training",
    label: "Education & Training",
  },
  {
    value: "hospitality_tourism",
    label: "Hospitality & Tourism",
  },
  {
    value: "aviation",
    label: "Aviation",
  },
  {
    value: "automotive",
    label: "Automotive",
  },
  {
    value: "industrial_manufacturing",
    label: "Industrial Manufacturing",
  },
  {
    value: "sustainability",
    label: "Sustainability",
  },
  {
    value: "public_services",
    label: "Public Services",
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [occupation, setOccupation] = useState("");
  const [domain, setDomain] = useState("");
  const [institutionCompany, setInstitutionCompany] =
    useState("");

  const [occupationOpen, setOccupationOpen] =
    useState(false);
  const [domainOpen, setDomainOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getProfile();

        setFullName(profile.full_name || "");
        setPhoneNumber(profile.phone_number || "");
        setOccupation(profile.occupation || "");
        setDomain(profile.domain || "");
        setInstitutionCompany(
          profile.institution_company || ""
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanFullName = fullName.trim();
    const cleanPhoneNumber = phoneNumber.trim();
    const cleanOccupation = occupation.trim();
    const cleanDomain = domain.trim();
    const cleanInstitutionCompany =
      institutionCompany.trim();

    if (!cleanFullName) {
      setError("Full name is required.");
      return;
    }

    if (!cleanOccupation) {
      setError("Please select your occupation.");
      return;
    }

    if (!cleanDomain) {
      setError("Please select your technical domain.");
      return;
    }

    if (!cleanInstitutionCompany) {
      setError(
        "Institution or company is required."
      );
      return;
    }

    try {
      setSaving(true);

      const updatedProfile =
        await updateProfile({
          fullName: cleanFullName,
          phoneNumber: cleanPhoneNumber,
          occupation: cleanOccupation,
          domain: cleanDomain,
          institutionCompany:
            cleanInstitutionCompany
        });

      setFullName(updatedProfile.full_name || "");
      setPhoneNumber(
        updatedProfile.phone_number || ""
      );
      setOccupation(
        updatedProfile.occupation || ""
      );
      setDomain(updatedProfile.domain || "");
      setInstitutionCompany(
        updatedProfile.institution_company || ""
      );

      setMessage("Profile saved successfully.");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedOccupation =
    occupationOptions.find(
      (option) => option.value === occupation
    )?.label || "Select occupation";

  const selectedDomain =
    domainOptions.find(
      (option) => option.value === domain
    )?.label || "Select domain";

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-card">
          <p>Loading profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-card">
        <button
          type="button"
          className="profile-back"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <p className="eyebrow">PROFILE</p>

        <h1>Your profile</h1>

        <p>Manage your personal information.</p>

        <form onSubmit={handleSave}>
          <label htmlFor="fullName">
            Full name
          </label>

          <input
            id="fullName"
            type="text"
            value={fullName}
            placeholder="Enter your full name"
            disabled={saving}
            onChange={(event) =>
              setFullName(event.target.value)
            }
          />

          <label htmlFor="email">
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={user?.email || ""}
            disabled
            readOnly
          />

          <label htmlFor="phoneNumber">
            Phone number
          </label>

          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            placeholder="Enter your phone number"
            disabled={saving}
            onChange={(event) =>
              setPhoneNumber(event.target.value)
            }
          />

          <label htmlFor="occupation">
            Occupation
          </label>

          <div className="custom-select">
            <button
              type="button"
              className="custom-select-button"
              disabled={saving}
              onClick={() =>
                setOccupationOpen(
                  (open) => !open
                )
              }
            >
              <span>{selectedOccupation}</span>

              <span className="custom-select-arrow">
                {occupationOpen ? "▲" : "▼"}
              </span>
            </button>

            {occupationOpen && (
              <div className="custom-select-menu">
                {occupationOptions.map((option) => {
                  const isSelected =
                    occupation === option.value;

                  return (
                    <button
                      type="button"
                      key={option.value}
                      className="custom-select-option"
                      onClick={() => {
                        setOccupation(option.value);
                        setOccupationOpen(false);
                      }}
                    >
                      <span
                        className={
                          isSelected
                            ? "occupation-radio selected"
                            : "occupation-radio"
                        }
                      >
                        {isSelected && (
                          <span className="occupation-radio-dot" />
                        )}
                      </span>

                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div> 

          <label htmlFor="domain">
            Select Domain
          </label>

          <div className="custom-select">
            <button
              type="button"
              className="custom-select-button"
              disabled={saving}
              onClick={() =>
                setDomainOpen((open) => !open)
              }
            >
              <span>{selectedDomain}</span>

              <span className="custom-select-arrow">
                {domainOpen ? "▲" : "▼"}
              </span>
            </button>

            {domainOpen && (
              <div className="custom-select-menu">
                {domainOptions.map((option) => {
                  const isSelected =
                    domain === option.value;

                  return (
                    <button
                      type="button"
                      key={option.value}
                      className="custom-select-option"
                      onClick={() => {
                        setDomain(option.value);
                        setDomainOpen(false);
                      }}
                    >
                      <span
                        className={
                          isSelected
                            ? "occupation-radio selected"
                            : "occupation-radio"
                        }
                      >
                        {isSelected && (
                          <span className="occupation-radio-dot" />
                        )}
                      </span>

                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label htmlFor="institutionCompany">
            Institution / Company
          </label>

          <input
            id="institutionCompany"
            type="text"
            value={institutionCompany}
            placeholder="Enter institution or company"
            disabled={saving}
            onChange={(event) =>
              setInstitutionCompany(
                event.target.value
              )
            }
          />

          {error && (
            <p className="auth-error">{error}</p>
          )}

          {message && (
            <p className="profile-success">
              {message}
            </p>
          )}

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </section>
    </main>
  );
}