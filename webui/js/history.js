import { getContext } from "../index.js";

export async function openHistoryModal() {
    try {
        const hist = await window.sendJsonData("/history_get", { context: getContext() });
        // const data = JSON.stringify(hist.history, null, 4);
        const data = hist.history
        const size = hist.tokens
        await showEditorModal(data, "markdown", `Histórico ~${size} tokens`, "Histórico da conversa visível para o LLM. O histórico é comprimido para caber na janela de contexto ao longo do tempo.");
    } catch (e) {
        window.toastFetchError("Erro ao buscar histórico", e)
        return
    }
}

export async function openCtxWindowModal() {
    try {
        const win = await window.sendJsonData("/ctx_window_get", { context: getContext() });
        const data = win.content
        const size = win.tokens
        await showEditorModal(data, "markdown", `Janela de contexto ~${size} tokens`, "Dados passados para o LLM durante a última interação. Contém mensagem do sistema, histórico da conversa e RAG.");
    } catch (e) {
        window.toastFetchError("Erro ao buscar contexto", e)
        return
    }
}

async function showEditorModal(data, type = "json", title, description = "") {
    // Generate the HTML with JSON Viewer container
    const html = `<div id="json-viewer-container"></div>`;

    // Open the modal with the generated HTML
    await window.genericModalProxy.openModal(title, description, html, ["history-viewer"]);

    // Initialize the JSON Viewer after the modal is rendered
    const container = document.getElementById("json-viewer-container");
    if (container) {
        const editor = ace.edit("json-viewer-container");

        const dark = localStorage.getItem('darkMode')
        if (dark != "false") {
            editor.setTheme("ace/theme/github_dark");
        } else {
            editor.setTheme("ace/theme/tomorrow");
        }

        editor.session.setMode("ace/mode/" + type);
        editor.setValue(data);
        editor.clearSelection();
        // editor.session.$toggleFoldWidget(5, {})
    }
}

window.openHistoryModal = openHistoryModal;
window.openCtxWindowModal = openCtxWindowModal;
