import { useEffect, useMemo, useState } from "react";
import { adminRequest } from "../services/adminapi";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";
import {
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
} from "../services/domainService";
import ConfirmDialog from "../components/ConfirmDialog";
export default function QuestionsPage({
  onBack,
  onCreate,
  onEdit,
}) {
  const [questions, setQuestions] = useState([]);
  const [domains, setDomains] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] =
    useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [showDomainModal, setShowDomainModal] =
    useState(false);
  const [showCategoryModal, setShowCategoryModal] =
    useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
const [page, setPage] = useState(1);
const [limit] = useState(10);

const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});

  const [showBulkUploadModal, setShowBulkUploadModal] =
  useState(false);
const [bulkUploadSuccess, setBulkUploadSuccess] =
  useState("");
const [bulkFile, setBulkFile] = useState(null);
const [bulkForm, setBulkForm] = useState({
  interview_type: "interview",
  difficulty: "beginner",
  role: "",
  domain_id: "",
  category_id: "",
});
const [bulkPreview, setBulkPreview] = useState(null);
const [previewLoading, setPreviewLoading] =
  useState(false);
const [bulkUploading, setBulkUploading] = useState(false);
const [bulkUploadError, setBulkUploadError] = useState("");
  
const [confirmDialog, setConfirmDialog] =
  useState({
    open: false,
    title: "",
    message: "",
    action: null,
    danger: false,
  });
async function loadData() {
  setLoading(true);
  setError("");

  try {
    const [
      questionsResponse,
      domainsResponse,
      categoriesResponse,
    ] = await Promise.all([
      adminRequest(
        `/questions?page=${page}&limit=${limit}`
      ),
      getDomains(),
      getCategories(),
    ]);

    const questionList = Array.isArray(questionsResponse)
      ? questionsResponse
      : questionsResponse?.questions || [];

    setQuestions(
      questionList.filter(
        (question) => question.is_active !== false
      )
    );

    setPagination(
      questionsResponse?.pagination || {
        page,
        limit,
        total: questionList.length,
        totalPages: 1,
      }
    );

    setDomains(domainsResponse || []);
    setCategories(categoriesResponse || []);
  } catch (requestError) {
    setError(requestError.message);
  } finally {
    setLoading(false);
  }
}

 useEffect(() => {
  loadData();
}, [page]);

  function getType(question) {
    return (
      question.interview_type ||
      question.interviewType ||
      "interview"
    );
  }

  function getTopics(question) {
    const topics =
      question.expected_topics ||
      question.expectedTopics ||
      [];

    return Array.isArray(topics) ? topics : [];
  }

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((question) => {
      const text = [
        question.text,
        question.role,
        question.domain,
        question.category_name,
        getType(question),
        question.difficulty,
        ...getTopics(question),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || text.includes(query)) &&
        (typeFilter === "all" ||
          getType(question) === typeFilter) &&
        (difficultyFilter === "all" ||
          question.difficulty === difficultyFilter) &&
        (domainFilter === "all" ||
          question.domain === domainFilter) &&
        (categoryFilter === "all" ||
          question.category_name === categoryFilter)
      );
    });
  }, [
    questions,
    search,
    typeFilter,
    difficultyFilter,
    domainFilter,
    categoryFilter,
  ]);

  function openDomainModal(domain = null) {
    setEditingItem(domain);
    setItemName(domain?.name || "");
    setItemDescription(domain?.description || "");
    setShowDomainModal(true);
  }

  function openCategoryModal(category = null) {
    setEditingItem(category);
    setItemName(category?.name || "");
    setItemDescription(category?.description || "");
    setShowCategoryModal(true);
  }

  function closeModal() {
    setShowDomainModal(false);
    setShowCategoryModal(false);
    setEditingItem(null);
    setItemName("");
    setItemDescription("");
  }

function downloadCsvTemplate() {
  const csvContent = [
    "question,expected_topics,reference_answer,answer_keypoints",
    '"What is React?","components,hooks","React is a JavaScript UI library","component-based,virtual DOM"',
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "questions-template.csv";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
function askDeleteQuestion(question) {
  setConfirmDialog({
    open: true,
    title: "Delete question?",
    message:
      "This question will be deactivated. Do you want to continue?",
    danger: true,
    action: () => deleteQuestion(question.id),
  });
}
async function previewBulkQuestions() {
  if (!bulkFile) {
    setBulkUploadError("Please select a CSV file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", bulkFile);

  setPreviewLoading(true);
  setBulkUploadError("");
  setBulkPreview(null);

  try {
    const result = await adminRequest(
      "/questions/bulk-preview",
      {
        method: "POST",
        body: formData,
      },
    );

    setBulkPreview(result);
  } catch (requestError) {
    setBulkUploadError(
      requestError.message ||
        "Preview failed.",
    );
  } finally {
    setPreviewLoading(false);
  }
}
 async function uploadQuestionsInBulk(event) {
  event.preventDefault();
if (!bulkPreview) {
  setBulkUploadError(
    "Please preview the CSV before uploading.",
  );
  return;
}

if (
  bulkPreview.invalidRows > 0 ||
  bulkPreview.duplicateRows > 0
) {
  setBulkUploadError(
    "Fix invalid or duplicate rows before uploading.",
  );
  return;
}

const confirmed = window.confirm(
  `Upload ${bulkPreview.validRows} valid questions?`,
);

if (!confirmed) {
  return;
}
  if (!bulkFile) {
    setBulkUploadError("Please select a CSV file.");
    return;
  }

  if (!bulkForm.role.trim()) {
    setBulkUploadError("Role is required.");
    return;
  }

  if (!bulkForm.domain_id) {
    setBulkUploadError("Domain is required.");
    return;
  }

  if (!bulkForm.category_id) {
    setBulkUploadError("Training category is required.");
    return;
  }

  const formData = new FormData();

  formData.append("file", bulkFile);
  formData.append(
    "interview_type",
    bulkForm.interview_type
  );
  formData.append("difficulty", bulkForm.difficulty);
  formData.append("role", bulkForm.role.trim());
  formData.append("domain_id", bulkForm.domain_id);
  formData.append("category_id", bulkForm.category_id);

  setBulkUploading(true);
  setBulkUploadError("");
  setBulkUploadSuccess("");

  try {
    const response = await adminRequest(
      "/questions/bulk-upload",
      {
        method: "POST",
        body: formData,
      }
    );

    setBulkUploadSuccess(
      response?.message ||
        `Successfully uploaded ${
          response?.insertedCount || "the"
        } questions.`
    );

    setShowBulkUploadModal(false);
    setBulkFile(null);
setBulkPreview(null);
    setBulkForm({
      interview_type: "interview",
      difficulty: "beginner",
      role: "",
      domain_id: "",
      category_id: "",
    });

    await loadData();
  } catch (requestError) {
    setBulkUploadError(
      requestError.message || "Bulk upload failed."
    );
  } finally {
    setBulkUploading(false);
  }
}
 async function saveItem(event) {
  event.preventDefault();

  const names = itemName
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const uniqueNames = [...new Set(names)];

  if (uniqueNames.length === 0) {
    setError(`Enter at least one ${showDomainModal ? "domain" : "category"}.`);
    return;
  }

  setSaving(true);
  setError("");

  try {
    for (const name of uniqueNames) {
      const data = {
        name,
        description: itemDescription.trim(),
      };

      if (showDomainModal) {
        if (editingItem) {
          await updateDomain(editingItem.id, data);
        } else {
          await createDomain(data);
        }
      }

      if (showCategoryModal) {
        if (editingItem) {
          await updateCategory(editingItem.id, data);
        } else {
          await createCategory(data);
        }
      }
    }

    closeModal();
    await loadData();
  } catch (requestError) {
    setError(requestError.message);
  } finally {
    setSaving(false);
  }
}

  async function removeItem(item, type) {
    const confirmed = window.confirm(
      `Delete ${item.name}?`
    );

    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");

    try {
      if (type === "domain") {
        await deleteDomain(item.id);
      } else {
        await deleteCategory(item.id);
      }

      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId(null);
    }
  }
async function deleteQuestion(questionId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this question?"
  );

  if (!confirmed) return;

  setDeletingId(questionId);
  setError("");

  try {
    await adminRequest(`/questions/${questionId}`, {
      method: "DELETE",
    });

    await loadData();
  } catch (requestError) {
    setError(requestError.message);
  } finally {
    setDeletingId(null);
  }
}
 function clearFilters() {
  setSearch("");
  setTypeFilter("all");
  setDifficultyFilter("all");
  setDomainFilter("all");
  setCategoryFilter("all");
  setPage(1);
}

  return (
    <main className="admin-page">
      <div className="admin-container">
        <header className="questions-header">
          <div>
            <p className="admin-eyebrow">
              QUESTION BANK
            </p>
            <h1>Interview Questions</h1>
            <p className="admin-subtitle">
              Manage questions, domains, and training
              categories.
            </p>
          </div>

          <button
            type="button"
            className="admin-back-button"
            onClick={onBack}
          >
            ← Back
          </button>
        </header>

        <section className="question-admin-actions">
          <button
            type="button"
            className="admin-primary-button"
            onClick={onCreate}
          >
            + Create Question
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => openDomainModal()}
          >
            + Manage Domains
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => openCategoryModal()}
          >
            + Manage Training Categories
          </button>
        </section>
<button
  type="button"
  className="admin-secondary-button"
  onClick={() => {
  setBulkUploadError("");
  setBulkUploadSuccess("");
  setBulkPreview(null);
  setShowBulkUploadModal(true);
}}
>
  Bulk Upload
</button>
        <section className="question-filter-card">
          <input
            type="search"
            placeholder="Search questions, roles, domains..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="all">All types</option>
            <option value="interview">Interview</option>
            <option value="training">Training</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(event) =>
              setDifficultyFilter(event.target.value)
            }
          >
            <option value="all">All difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">
              Intermediate
            </option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={domainFilter}
            onChange={(event) =>
              setDomainFilter(event.target.value)
            }
          >
            <option value="all">All domains</option>

            {domains.map((domain) => (
              <option key={domain.id} value={domain.name}>
                {domain.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="all">All categories</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.name}
              >
                {category.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="filter-clear-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </section>

        {error && (
          <div className="admin-message admin-message-error">
            {error}
          </div>
        )}
{bulkUploadSuccess && (
  <div className="admin-message admin-message-success">
    {bulkUploadSuccess}
  </div>
)}
        {loading ? (
          <div className="question-empty-card">
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="question-empty-card">
            No matching questions found.
          </div>
        ) : (
          <section className="question-list">
            {filteredQuestions.map((question, index) => (
              <article
                className="question-card"
                key={question.id}
              >
                <div className="question-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="question-content">
                  <div className="question-badges">
                    <span>{getType(question)}</span>
                    <span>
                      {question.difficulty || "Beginner"}
                    </span>

                    {question.role && (
                      <span>{question.role}</span>
                    )}

                    {question.domain && (
                      <span>Domain: {question.domain}</span>
                    )}

                    {question.category_name && (
                      <span>
                        Category: {question.category_name}
                      </span>
                    )}
                  </div>

                  <h2>
                    {question.text ||
                      "Question text unavailable"}
                  </h2>

                  {getTopics(question).length > 0 && (
                    <div className="question-topics">
                      {getTopics(question).map((topic) => (
                        <span key={topic}>{topic}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="question-buttons">
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => onEdit(question.id)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                   onClick={() => askDeleteQuestion(question)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {pagination.totalPages > 1 && (
  <div className="pagination-controls">
    <button
      type="button"
      className="admin-secondary-button"
      disabled={page === 1 || loading}
      onClick={() =>
        setPage((currentPage) => currentPage - 1)
      }
    >
      Previous
    </button>

    <span>
      Page {pagination.page} of{" "}
      {pagination.totalPages}
    </span>

    <button
      type="button"
      className="admin-secondary-button"
      disabled={
        page === pagination.totalPages || loading
      }
      onClick={() =>
        setPage((currentPage) => currentPage + 1)
      }
    >
      Next
    </button>
  </div>
)}

<BulkUploadModal
  open={showBulkUploadModal}
  onClose={() => setShowBulkUploadModal(false)}
  domains={domains}
  categories={categories}
  form={bulkForm}
  setForm={setBulkForm}
  file={bulkFile}
  setFile={setBulkFile}
  error={bulkUploadError}
  uploading={bulkUploading}
  onSubmit={uploadQuestionsInBulk}
  onDownloadTemplate={downloadCsvTemplate}
  onPreview={previewBulkQuestions}
  preview={bulkPreview}
  previewLoading={previewLoading}
/>
        <ListManager
          open={showDomainModal}
          title="Manage Domains"
          items={domains}
          itemLabel="domain"
          editingItem={editingItem}
          onClose={closeModal}
          onAdd={() => openDomainModal()}
          onEdit={openDomainModal}
          onDelete={(item) =>
            removeItem(item, "domain")
          }
          deletingId={deletingId}
          name={itemName}
          description={itemDescription}
          setName={setItemName}
          setDescription={setItemDescription}
          onSave={saveItem}
          saving={saving}
        />

        <ListManager
          open={showCategoryModal}
          title="Manage Training Categories"
          items={categories}
          itemLabel="category"
          editingItem={editingItem}
          onClose={closeModal}
          onAdd={() => openCategoryModal()}
          onEdit={openCategoryModal}
          onDelete={(item) =>
            removeItem(item, "category")
          }
          deletingId={deletingId}
          name={itemName}
          description={itemDescription}
          setName={setItemName}
          setDescription={setItemDescription}
          onSave={saveItem}
          saving={saving}
        />
      </div>
      <ConfirmDialog
  open={confirmDialog.open}
  title={confirmDialog.title}
  message={confirmDialog.message}
  danger={confirmDialog.danger}
  onCancel={() =>
    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      action: null,
      danger: false,
    })
  }
  onConfirm={async () => {
    const action = confirmDialog.action;

    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      action: null,
      danger: false,
    });

    if (action) {
      await action();
    }
  }}
/>
    </main>
  );
}

function ListManager({
  open,
  title,
  items,
  itemLabel,
  editingItem,
  onClose,
  onAdd,
  onEdit,
  onDelete,
  deletingId,
  name,
  description,
  setName,
  setDescription,
  onSave,
  saving,
}) {
  if (!open) return null;

  return (
    <div
      className="list-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="list-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="list-modal-header">
          <div>
            <p>Administration</p>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="list-form"
          onSubmit={onSave}
        >
         <input
  value={name}
  onChange={(event) =>
    setName(event.target.value)
  }
  placeholder={`Enter ${itemLabel} names separated by commas`}
  required
/>

<small className="list-input-help">
  Add multiple {itemLabel}s by separating them with commas.
</small>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder={`${itemLabel} description`}
            rows="3"
          />

          <div className="list-form-buttons">
            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingItem
                ? "Update"
                : "Add"}
            </button>

            {editingItem && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={onAdd}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="managed-list">
          <h3>
            Existing {itemLabel}s ({items.length})
          </h3>

          {items.length === 0 ? (
            <p>No {itemLabel}s created yet.</p>
          ) : (
            items.map((item) => (
              <div
                className="managed-list-item"
                key={item.id}
              >
                <div>
                  <strong>{item.name}</strong>
                  {item.description && (
                    <p>{item.description}</p>
                  )}
                </div>

                <div className="managed-list-actions">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="danger-text"
                    onClick={() => onDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BulkUploadModal({
  open,
  onClose,
  domains,
  categories,
  form,
  setForm,
  file,
  setFile,
  error,
  uploading,
  onSubmit,
  onDownloadTemplate,
  onPreview,
  preview,
  previewLoading,
}) {
  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div
      className="list-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="list-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="list-modal-header">
          <div>
            <p>Administration</p>
            <h2>Bulk Upload Questions</h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form
          className="list-form"
          onSubmit={onSubmit}
        >
          <select
            value={form.interview_type}
            onChange={(event) =>
              updateField(
                "interview_type",
                event.target.value
              )
            }
          >
            <option value="interview">Interview</option>
            <option value="training">Training</option>
          </select>

          <select
            value={form.difficulty}
            onChange={(event) =>
              updateField(
                "difficulty",
                event.target.value
              )
            }
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">
              Intermediate
            </option>
            <option value="advanced">Advanced</option>
          </select>

          <input
            value={form.role}
            onChange={(event) =>
              updateField("role", event.target.value)
            }
            placeholder="Role"
            required
          />

          <select
            value={form.domain_id}
            onChange={(event) =>
              updateField("domain_id", event.target.value)
            }
            required
          >
            <option value="">Select domain</option>

            {domains.map((domain) => (
            <option key={domain.id} value={domain.name}>
  {domain.name}
</option>
            ))}
          </select>

          <select
            value={form.category_id}
            onChange={(event) =>
              updateField("category_id", event.target.value)
            }
            required
          >
            <option value="">Select training category</option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
<button
  type="button"
  className="admin-secondary-button"
  onClick={onDownloadTemplate}
>
  Download CSV Template
</button>

<button
  type="button"
  className="admin-secondary-button"
  onClick={onPreview}
  disabled={!file || previewLoading || uploading}
>
  {previewLoading
    ? "Previewing..."
    : "Preview CSV"}
</button>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
            required
          />

          <small className="list-input-help">
            CSV columns must be:
            <br />
            question, expected_topics, reference_answer,
            answer_keypoints
          </small>
{preview && (
  <div className="bulk-preview">
    <h3>CSV Preview</h3>

    <p>Total rows: {preview.totalRows}</p>
    <p>Valid rows: {preview.validRows}</p>
    <p>Invalid rows: {preview.invalidRows}</p>
    <p>Duplicate rows: {preview.duplicateRows}</p>

    {preview.errors?.length > 0 && (
      <div className="admin-message admin-message-error">
        {preview.errors.map((item) => (
          <p
            key={`${item.row}-${item.field}`}
          >
            Row {item.row}, {item.field}:{" "}
            {item.message}
          </p>
        ))}
      </div>
    )}

    <div className="bulk-preview-rows">
      {preview.rows?.map((row) => (
        <div
          key={row.row}
          className={`bulk-preview-row ${row.status}`}
        >
          <strong>Row {row.row}</strong>
          <span>
            {row.question || "Empty question"}
          </span>
          <span>{row.status}</span>
        </div>
      ))}
    </div>
  </div>
)}
          {error && (
            <div className="admin-message admin-message-error">
              {error}
            </div>
          )}

          <div className="list-form-buttons">
            <button
              type="submit"
              className="admin-primary-button"
              disabled={uploading}
            >
              {uploading
                ? "Uploading..."
                : "Upload Questions"}
            </button>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}