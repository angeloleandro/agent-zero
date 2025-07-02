const fileBrowserModalProxy = {
  isOpen: false,
  isLoading: false,

  browser: {
    title: "Navegador de Arquivos",
    currentPath: "",
    entries: [],
    parentPath: "",
    sortBy: "nome",
    sortDirection: "asc",
  },

  // Initialize navigation history
  history: [],

  async openModal(path) {
    const modalEl = document.getElementById("fileBrowserModal");
    const modalAD = Alpine.$data(modalEl);

    modalAD.isOpen = true;
    modalAD.isLoading = true;
    modalAD.history = []; // reset history when opening modal

    // Initialize currentPath to root if it's empty
    if (path) modalAD.browser.currentPath = path;
    else if (!modalAD.browser.currentPath)
      modalAD.browser.currentPath = "$WORK_DIR";

    await modalAD.fetchFiles(modalAD.browser.currentPath);
  },

  isArchive(filename) {
    const archiveExts = ["zip", "tar", "gz", "rar", "7z"];
    const ext = filename.split(".").pop().toLowerCase();
    return archiveExts.includes(ext);
  },

  async fetchFiles(path = "") {
    this.isLoading = true;
    try {
      const response = await fetchApi(
        `/get_work_dir_files?path=${encodeURIComponent(path)}`
      );

      if (response.ok) {
        const data = await response.json();
        this.browser.entries = data.data.entries;
        this.browser.currentPath = data.data.current_path;
        this.browser.parentPath = data.data.parent_path;
      } else {
        console.error("Erro ao buscar arquivos:", await response.text());
        this.browser.entries = [];
      }
    } catch (error) {
      window.toastFetchError("Erro ao buscar arquivos", error);
      this.browser.entries = [];
    } finally {
      this.isLoading = false;
    }
  },

  async navigateToFolder(path) {
    // Push current path to history before navigating
    if (this.browser.currentPath !== path) {
      this.history.push(this.browser.currentPath);
    }
    await this.fetchFiles(path);
  },

  async navigateUp() {
    if (this.browser.parentPath !== "") {
      // Push current path to history before navigating up
      this.history.push(this.browser.currentPath);
      await this.fetchFiles(this.browser.parentPath);
    }
  },

  sortFiles(entries) {
    return [...entries].sort((a, b) => {
      // Pastas sempre vêm primeiro
      if (a.is_dir !== b.is_dir) {
        return a.is_dir ? -1 : 1;
      }

      const direction = this.browser.sortDirection === "asc" ? 1 : -1;
      switch (this.browser.sortBy) {
        case "nome":
          return direction * a.name.localeCompare(b.name);
        case "tamanho":
          return direction * (a.size - b.size);
        case "data":
          return direction * (new Date(a.modified) - new Date(b.modified));
        default:
          return 0;
      }
    });
  },

  toggleSort(column) {
    if (this.browser.sortBy === column) {
      this.browser.sortDirection =
        this.browser.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.browser.sortBy = column;
      this.browser.sortDirection = "asc";
    }
  },

  async deleteFile(file) {
    if (!confirm(`Tem certeza de que deseja excluir ${file.name}?`)) {
      return;
    }

    try {
      const response = await fetchApi("/delete_work_dir_file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: file.path,
          currentPath: this.browser.currentPath,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.browser.entries = this.browser.entries.filter(
          (entry) => entry.path !== file.path
        );
        alert("Arquivo excluído com sucesso.");
      } else {
        alert(`Erro ao excluir arquivo: ${await response.text()}`);
      }
    } catch (error) {
      window.toastFetchError("Erro ao excluir arquivo", error);
      alert("Erro ao excluir arquivo");
    }
  },

  async handleFileUpload(event) {
    try {
      const files = event.target.files;
      if (!files.length) return;

      const formData = new FormData();
      formData.append("path", this.browser.currentPath);

      for (let i = 0; i < files.length; i++) {
        const ext = files[i].name.split(".").pop().toLowerCase();
        if (!["zip", "tar", "gz", "rar", "7z"].includes(ext)) {
          if (files[i].size > 100 * 1024 * 1024) {
            // 100MB
            alert(
              `O arquivo ${files[i].name} excede o tamanho máximo permitido de 100MB.`
            );
            continue;
          }
        }
        formData.append("files[]", files[i]);
      }

      // Proceed with upload after validation
      const response = await fetchApi("/upload_work_dir_files", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Update the file list with new data
        this.browser.entries = data.data.entries.map((entry) => ({
          ...entry,
          uploadStatus: data.failed.includes(entry.name) ? "failed" : "success",
        }));
        this.browser.currentPath = data.data.current_path;
        this.browser.parentPath = data.data.parent_path;

        // Exibir mensagem de sucesso
        if (data.failed && data.failed.length > 0) {
          const failedFiles = data.failed
            .map((file) => `${file.name}: ${file.error}`)
            .join("\n");
          alert(`Alguns arquivos falharam ao carregar:\n${failedFiles}`);
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      window.toastFetchError("Erro ao carregar arquivos", error);
      alert("Erro ao carregar arquivos");
    }
  },

  async downloadFile(file) {
    try {
      const downloadUrl = `/download_work_dir_file?path=${encodeURIComponent(
        file.path
      )}`;

      const response = await fetchApi(downloadUrl);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      window.toastFetchError("Erro ao baixar arquivo", error);
      alert("Erro ao baixar arquivo");
    }
  },

  // Helper Functions
  formatFileSize(size) {
    if (size === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  },

  handleClose() {
    this.isOpen = false;
  },
};

// Wait for Alpine to be ready
document.addEventListener("alpine:init", () => {
  Alpine.data("fileBrowserModalProxy", () => ({
    init() {
      Object.assign(this, fileBrowserModalProxy);
      // Ensure immediate file fetch when modal opens
      this.$watch("isOpen", async (value) => {
        if (value) {
          await this.fetchFiles(this.browser.currentPath);
        }
      });
    },
  }));
});

// Keep the global assignment for backward compatibility
window.fileBrowserModalProxy = fileBrowserModalProxy;

openFileLink = async function (path) {
  try {
    const resp = await window.sendJsonData("/file_info", { path });
    if (!resp.exists) {
      window.toast("O arquivo não existe.", "error");
      return;
    }

    if (resp.is_dir) {
      fileBrowserModalProxy.openModal(resp.abs_path);
    } else {
      fileBrowserModalProxy.downloadFile({
        path: resp.abs_path,
        name: resp.file_name,
      });
    }
  } catch (e) {
    window.toastFetchError("Erro ao abrir arquivo", e);
  }
};
window.openFileLink = openFileLink;
