import { useEffect, useMemo, useState } from "react";
import { adminRequest } from "../services/adminapi";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [selectedUser, setSelectedUser] = useState(null);
  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await adminRequest("/users");

        setUsers(
          Array.isArray(data)
            ? data
            : data.users || data.data || []
        );
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.email || "")
          .toLowerCase()
          .includes(query) ||
        String(user.full_name || "")
          .toLowerCase()
          .includes(query) ||
        String(user.user_id || "")
          .toLowerCase()
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "verified" && user.is_verified) ||
        (filter === "unverified" && !user.is_verified);

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <p>User management</p>
          <h1>Users</h1>
        </div>

        <span className="admin-live-badge">
          {users.length} total users
        </span>
      </header>

      <div className="admin-card admin-toolbar">
        <input
          type="search"
          placeholder="Search by name, email, or user ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All users</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {loading && (
        <div className="admin-card">
          <p>Loading users...</p>
        </div>
      )}

      {!loading && error && (
        <div className="admin-card">
          <p className="error">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="admin-table-wrapper">
          {filteredUsers.length === 0 ? (
            <p className="admin-empty">
              No users match your search.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Verification</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id || user.id}>
                    <td>
                      <strong>
                        {user.full_name || "Unnamed user"}
                      </strong>
                      <small>
                        {user.user_id || user.id}
                      </small>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={
                          user.is_verified
                            ? "status-badge"
                            : "status-badge inactive"
                        }
                      >
                        {user.is_verified
                          ? "Verified"
                          : "Unverified"}
                      </span>
                    </td>

                    <td>{formatDate(user.created_at)}</td>

                    <td>
                      <button
                        type="button"
                        className="admin-table-action"
                        onClick={() => setSelectedUser(user)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedUser && (
  <div
    className="user-modal-backdrop"
    onClick={() => setSelectedUser(null)}
  >
    <div
      className="user-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <button onClick={() => setSelectedUser(null)}>
        Close
      </button>

      <h2>User Details</h2>

      <p><strong>Email:</strong> {selectedUser.email}</p>
      <p><strong>User ID:</strong> {selectedUser.user_id}</p>
      <p>
        <strong>Verification:</strong>{" "}
        {selectedUser.is_verified ? "Verified" : "Unverified"}
      </p>
      <p><strong>Joined:</strong> {selectedUser.created_at}</p>

      <hr />

      <h3>Profile Details</h3>

      <p><strong>Full name:</strong> {selectedUser.full_name || "Not provided"}</p>
      <p><strong>Phone:</strong> {selectedUser.phone_number || "Not provided"}</p>
      <p><strong>Occupation:</strong> {selectedUser.occupation || "Not provided"}</p>
      <p><strong>Domain:</strong> {selectedUser.domain || "Not provided"}</p>
      <p>
        <strong>Institution / Company:</strong>{" "}
        {selectedUser.institution_company || "Not provided"}
      </p>

      <p>
  <strong>Profile created:</strong>{" "}
  {selectedUser.profile_created_at || "Not provided"}
</p>

<p>
  <strong>Profile updated:</strong>{" "}
  {selectedUser.profile_updated_at || "Not provided"}
</p>
    </div>
  </div>
)}
    </section>
  );
}