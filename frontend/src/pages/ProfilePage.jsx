import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  updateProfile
} from "../services/profileApi";

import "../styles/profile.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fullName, setFullName] =
    useState("");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile =
          await getProfile();

        setFullName(
          profile.full_name || ""
        );

        setPhoneNumber(
          profile.phone_number || ""
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

    try {
      setSaving(true);

      const updatedProfile =
        await updateProfile({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim()
        });

      setFullName(
        updatedProfile.full_name || ""
      );

      setPhoneNumber(
        updatedProfile.phone_number || ""
      );

      setEditing(false);
      setMessage(
        "Profile saved successfully."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

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

        <p className="eyebrow">
          PROFILE
        </p>

        <h1>Your profile</h1>

        <p>
          Manage your personal information.
        </p>

        <form onSubmit={handleSave}>
          <label htmlFor="fullName">
            Full name
          </label>

          <input
            id="fullName"
            type="text"
            value={fullName}
            placeholder="Enter your full name"
            disabled={false}
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
            disabled={false}
            onChange={(event) =>
              setPhoneNumber(event.target.value)
            }
          />

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          {message && (
            <p className="profile-success">
              {message}
            </p>
          )}

          {editing ? (
            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setEditing(true);
              }}
            >
              Edit Profile
            </button>
          )}
        </form>
      </section>
    </main>
  );
}