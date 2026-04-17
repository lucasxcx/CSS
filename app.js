const STORAGE_KEY = "portal-pedidos-basico-v1";

const statusMap = {
    pendente: "Pendente",
    em_rota: "Em rota",
    entregue: "Entregue",
    cancelado: "Cancelado"
};

const refs = {
    form: document.getElementById("order-form"),
    summary: document.getElementById("summary"),
    ordersBody: document.getElementById("orders-body"),
    searchInput: document.getElementById("search-input"),
    statusFilter: document.getElementById("status-filter"),
    lastSync: document.getElementById("last-sync")
};

let orders = loadOrders();

if (orders.length === 0) {
    orders = [
        {
            id: "PED-1001",
            cliente: "Loja Central",
            produto: "Caixa de papel",
            prazoEntrega: toISODate(addDays(new Date(), 1)),
            status: "pendente",
            criadoEm: new Date().toISOString()
        }
    ];
    saveOrders();
}

configureFormDefaults();
bindEvents();
renderAll();

function bindEvents() {
    refs.form.addEventListener("submit", handleCreateOrder);
    refs.searchInput.addEventListener("input", renderTable);
    refs.statusFilter.addEventListener("change", renderTable);
    refs.ordersBody.addEventListener("change", handleStatusChange);
    refs.ordersBody.addEventListener("click", handleDelete);
}

function configureFormDefaults() {
    const dateInput = refs.form.elements.prazoEntrega;
    const today = toISODate(new Date());
    dateInput.min = today;
    dateInput.value = toISODate(addDays(new Date(), 1));
}

function handleCreateOrder(event) {
    event.preventDefault();

    const formData = new FormData(refs.form);
    const order = {
        id: generateOrderId(),
        cliente: String(formData.get("cliente")).trim(),
        produto: String(formData.get("produto")).trim(),
        prazoEntrega: String(formData.get("prazoEntrega")),
        status: "pendente",
        criadoEm: new Date().toISOString()
    };

    orders.unshift(order);
    saveOrders();
    refs.form.reset();
    configureFormDefaults();
    renderAll();
}

function handleStatusChange(event) {
    if (!event.target.classList.contains("status-select")) {
        return;
    }

    const id = decodeURIComponent(event.target.dataset.id);
    const status = event.target.value;

    orders = orders.map((order) => {
        if (order.id !== id) {
            return order;
        }

        return {
            ...order,
            status
        };
    });

    saveOrders();
    renderAll();
}

function handleDelete(event) {
    const button = event.target.closest("button[data-action='delete']");
    if (!button) {
        return;
    }

    const id = decodeURIComponent(button.dataset.id);
    orders = orders.filter((order) => order.id !== id);
    saveOrders();
    renderAll();
}

function renderAll() {
    renderSummary();
    renderTable();
    refs.lastSync.textContent = `Atualizado em ${formatDateTime(new Date().toISOString())}`;
}

function renderSummary() {
    const total = orders.length;
    const pendentes = orders.filter((order) => order.status === "pendente").length;
    const entregues = orders.filter((order) => order.status === "entregue").length;
    refs.summary.textContent = `Total: ${total} | Pendentes: ${pendentes} | Entregues: ${entregues}`;
}

function renderTable() {
    const filtered = applyFilters();

    if (filtered.length === 0) {
        refs.ordersBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">Nenhum pedido encontrado.</td>
            </tr>
        `;
        return;
    }

    refs.ordersBody.innerHTML = filtered
        .map((order) => {
            const encodedId = encodeURIComponent(order.id);
            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.cliente)}</td>
                    <td>${escapeHtml(order.produto)}</td>
                    <td>${formatDate(order.prazoEntrega)}</td>
                    <td>
                        <select class="status-select" data-id="${encodedId}">
                            ${buildStatusOptions(order.status)}
                        </select>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button type="button" class="btn-danger" data-action="delete" data-id="${encodedId}">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function applyFilters() {
    const search = refs.searchInput.value.trim().toLowerCase();
    const status = refs.statusFilter.value;

    return orders.filter((order) => {
        const matchesSearch =
            search.length === 0 ||
            order.id.toLowerCase().includes(search) ||
            order.cliente.toLowerCase().includes(search) ||
            order.produto.toLowerCase().includes(search);

        const matchesStatus = status === "todos" || order.status === status;
        return matchesSearch && matchesStatus;
    });
}

function buildStatusOptions(selectedStatus) {
    return Object.entries(statusMap)
        .map(([value, label]) => {
            const selected = value === selectedStatus ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");
}

function loadOrders() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((item) => normalizeOrder(item))
            .filter((item) => item.id.length > 0);
    } catch (error) {
        return [];
    }
}

function saveOrders() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function normalizeOrder(rawOrder) {
    const raw = rawOrder && typeof rawOrder === "object" ? rawOrder : {};
    const status = statusMap[raw.status] ? raw.status : "pendente";

    return {
        id: String(raw.id || generateOrderId()),
        cliente: String(raw.cliente || "Cliente não informado"),
        produto: String(raw.produto || "Produto não informado"),
        prazoEntrega: String(raw.prazoEntrega || toISODate(addDays(new Date(), 1))),
        status,
        criadoEm: raw.criadoEm || new Date().toISOString()
    };
}

function generateOrderId() {
    const stamp = Date.now().toString().slice(-6);
    return `PED-${stamp}`;
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(dateString));
}

function formatDateTime(dateString) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(dateString));
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function addDays(date, offset) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + offset);
    return nextDate;
}

function toISODate(date) {
    const adjusted = new Date(date);
    adjusted.setMinutes(adjusted.getMinutes() - adjusted.getTimezoneOffset());
    return adjusted.toISOString().slice(0, 10);
}
