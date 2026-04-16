const STORAGE_KEY = "portal-pedidos-entregas-v1";

const statusMap = {
    novo: "Novo",
    separacao: "Em separação",
    em_rota: "Em rota",
    entregue: "Entregue",
    cancelado: "Cancelado"
};

const priorityMap = {
    normal: "Normal",
    alta: "Alta",
    urgente: "Urgente"
};

const refs = {
    form: document.getElementById("order-form"),
    ordersBody: document.getElementById("orders-body"),
    searchInput: document.getElementById("search-input"),
    statusFilter: document.getElementById("status-filter"),
    priorityFilter: document.getElementById("priority-filter"),
    lastSync: document.getElementById("last-sync"),
    emptyStateTemplate: document.getElementById("empty-state-template"),
    kpiTotal: document.getElementById("kpi-total"),
    kpiPendentes: document.getElementById("kpi-pendentes"),
    kpiEmRota: document.getElementById("kpi-em-rota"),
    kpiEntregues: document.getElementById("kpi-entregues"),
    kpiAtrasados: document.getElementById("kpi-atrasados"),
    kpiFaturamento: document.getElementById("kpi-faturamento"),
    listInRoute: document.getElementById("delivery-in-route"),
    listOverdue: document.getElementById("delivery-overdue"),
    listCompleted: document.getElementById("delivery-completed")
};

let orders = loadOrders();

if (orders.length === 0) {
    orders = buildSeedOrders();
    saveOrders();
}

configureFormDefaults();
bindEvents();
renderAll();

function bindEvents() {
    refs.form.addEventListener("submit", handleCreateOrder);

    refs.searchInput.addEventListener("input", renderOrdersTable);
    refs.statusFilter.addEventListener("change", renderOrdersTable);
    refs.priorityFilter.addEventListener("change", renderOrdersTable);

    refs.ordersBody.addEventListener("change", handleTableChange);
    refs.ordersBody.addEventListener("click", handleTableClick);
}

function configureFormDefaults() {
    const dateInput = refs.form.elements.prazoEntrega;
    const today = toISODate(new Date());
    dateInput.min = today;
    dateInput.value = toISODate(addDays(new Date(), 1));
}

function handleCreateOrder(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const novoPedido = {
        id: generateOrderId(),
        cliente: getTrimmedValue(formData, "cliente"),
        telefone: getTrimmedValue(formData, "telefone"),
        endereco: getTrimmedValue(formData, "endereco"),
        produto: getTrimmedValue(formData, "produto"),
        quantidade: Number(formData.get("quantidade")),
        valor: Number(formData.get("valor")),
        prazoEntrega: String(formData.get("prazoEntrega")),
        entregador: getTrimmedValue(formData, "entregador"),
        prioridade: String(formData.get("prioridade")),
        status: "novo",
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        entregueEm: null
    };

    orders.unshift(novoPedido);
    saveOrders();

    form.reset();
    configureFormDefaults();
    renderAll();
}

function handleTableChange(event) {
    if (!event.target.classList.contains("status-select")) {
        return;
    }

    const orderId = decodeURIComponent(event.target.dataset.id);
    updateOrderStatus(orderId, event.target.value);
}

function handleTableClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const orderId = decodeURIComponent(button.dataset.id);
    const action = button.dataset.action;

    if (action === "route") {
        updateOrderStatus(orderId, "em_rota");
        return;
    }

    if (action === "complete") {
        updateOrderStatus(orderId, "entregue");
        return;
    }

    if (action === "cancel") {
        updateOrderStatus(orderId, "cancelado");
        return;
    }

    if (action === "delete") {
        orders = orders.filter((order) => order.id !== orderId);
        saveOrders();
        renderAll();
    }
}

function updateOrderStatus(orderId, status) {
    orders = orders.map((order) => {
        if (order.id !== orderId) {
            return order;
        }

        const nextOrder = {
            ...order,
            status,
            atualizadoEm: new Date().toISOString()
        };

        if (status === "entregue") {
            nextOrder.entregueEm = new Date().toISOString();
        } else if (order.status === "entregue") {
            nextOrder.entregueEm = null;
        }

        return nextOrder;
    });

    saveOrders();
    renderAll();
}

function renderAll() {
    renderDashboard();
    renderOrdersTable();
    renderDeliveryPanel();
    refs.lastSync.textContent = `Atualizado em ${formatDateTime(new Date().toISOString())}`;
}

function renderDashboard() {
    const pendentes = orders.filter(
        (order) => order.status !== "entregue" && order.status !== "cancelado"
    );
    const emRota = orders.filter((order) => order.status === "em_rota");
    const entregues = orders.filter((order) => order.status === "entregue");
    const atrasados = orders.filter(isOverdue);
    const faturamento = orders
        .filter((order) => order.status !== "cancelado")
        .reduce((acc, order) => acc + order.valor * order.quantidade, 0);

    refs.kpiTotal.textContent = String(orders.length);
    refs.kpiPendentes.textContent = String(pendentes.length);
    refs.kpiEmRota.textContent = String(emRota.length);
    refs.kpiEntregues.textContent = String(entregues.length);
    refs.kpiAtrasados.textContent = String(atrasados.length);
    refs.kpiFaturamento.textContent = formatCurrency(faturamento);
}

function renderOrdersTable() {
    const filteredOrders = applyFilters(orders);

    if (filteredOrders.length === 0) {
        refs.ordersBody.innerHTML = `
            <tr>
                <td colspan="9">Nenhum pedido encontrado com os filtros atuais.</td>
            </tr>
        `;
        return;
    }

    refs.ordersBody.innerHTML = filteredOrders
        .map((order) => {
            const overdueLabel = isOverdue(order) ? '<span class="status-overdue">Atrasado</span>' : "";
            const cliente = escapeHtml(order.cliente);
            const telefone = escapeHtml(order.telefone);
            const produto = escapeHtml(order.produto);
            const endereco = escapeHtml(order.endereco);
            const entregador = escapeHtml(order.entregador);
            const encodedId = encodeURIComponent(order.id);

            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>
                        ${cliente}
                        <span class="cell-subtext">${telefone}</span>
                    </td>
                    <td>
                        ${produto} (x${order.quantidade})
                        <span class="cell-subtext">${endereco}</span>
                    </td>
                    <td>
                        ${formatDate(order.prazoEntrega)}
                        <span class="cell-subtext">${overdueLabel}</span>
                    </td>
                    <td>${entregador}</td>
                    <td>
                        <select class="status-select" data-id="${encodedId}">
                            ${buildStatusOptions(order.status)}
                        </select>
                    </td>
                    <td><span class="tag priority-${order.prioridade}">${priorityMap[order.prioridade]}</span></td>
                    <td>${formatCurrency(order.valor * order.quantidade)}</td>
                    <td>
                        <div class="table-actions">
                            <button type="button" class="btn-secondary" data-action="route" data-id="${encodedId}">Em rota</button>
                            <button type="button" class="btn-success" data-action="complete" data-id="${encodedId}">Concluir</button>
                            <button type="button" class="btn-danger" data-action="cancel" data-id="${encodedId}">Cancelar</button>
                            <button type="button" class="btn-danger" data-action="delete" data-id="${encodedId}">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function renderDeliveryPanel() {
    const inRoute = orders.filter((order) => order.status === "em_rota");
    const overdue = orders.filter(isOverdue);
    const completedToday = orders.filter(isCompletedToday);

    fillDeliveryList(refs.listInRoute, inRoute, (order) => {
        return `
            <li class="delivery-item">
                <strong>${escapeHtml(order.id)} - ${escapeHtml(order.cliente)}</strong>
                ${escapeHtml(order.produto)} | Entregador: ${escapeHtml(order.entregador)}<br>
                Prazo: ${formatDate(order.prazoEntrega)}
            </li>
        `;
    });

    fillDeliveryList(refs.listOverdue, overdue, (order) => {
        return `
            <li class="delivery-item">
                <strong>${escapeHtml(order.id)} - ${escapeHtml(order.cliente)}</strong>
                ${escapeHtml(order.produto)} | Entregador: ${escapeHtml(order.entregador)}<br>
                Vencimento: ${formatDate(order.prazoEntrega)}
            </li>
        `;
    });

    fillDeliveryList(refs.listCompleted, completedToday, (order) => {
        return `
            <li class="delivery-item">
                <strong>${escapeHtml(order.id)} - ${escapeHtml(order.cliente)}</strong>
                ${escapeHtml(order.produto)} | ${formatDateTime(order.entregueEm)}
            </li>
        `;
    });
}

function fillDeliveryList(listElement, items, itemRenderer) {
    if (items.length === 0) {
        listElement.innerHTML = "";
        listElement.appendChild(refs.emptyStateTemplate.content.cloneNode(true));
        return;
    }

    listElement.innerHTML = items.map(itemRenderer).join("");
}

function applyFilters(rawOrders) {
    const search = refs.searchInput.value.trim().toLowerCase();
    const status = refs.statusFilter.value;
    const priority = refs.priorityFilter.value;

    return rawOrders.filter((order) => {
        const matchesSearch =
            search.length === 0 ||
            order.id.toLowerCase().includes(search) ||
            order.cliente.toLowerCase().includes(search) ||
            order.produto.toLowerCase().includes(search);

        const matchesStatus = status === "todos" || order.status === status;
        const matchesPriority = priority === "todas" || order.prioridade === priority;

        return matchesSearch && matchesStatus && matchesPriority;
    });
}

function buildStatusOptions(selectedStatus) {
    return Object.entries(statusMap)
        .map(([value, label]) => {
            const selected = selectedStatus === value ? "selected" : "";
            return `<option value="${value}" ${selected}>${label}</option>`;
        })
        .join("");
}

function buildSeedOrders() {
    return [
        {
            id: "PED-1001",
            cliente: "Mercado Central",
            telefone: "(11) 97777-1000",
            endereco: "Av. Brasil, 1020 - Centro",
            produto: "Cesta básica",
            quantidade: 8,
            valor: 129.9,
            prazoEntrega: toISODate(addDays(new Date(), 1)),
            entregador: "Carlos Souza",
            prioridade: "alta",
            status: "separacao",
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            entregueEm: null
        },
        {
            id: "PED-1002",
            cliente: "Restaurante Sabor do Sul",
            telefone: "(11) 96666-2200",
            endereco: "Rua Aurora, 85 - Vila Nova",
            produto: "Caixa térmica",
            quantidade: 2,
            valor: 459.0,
            prazoEntrega: toISODate(new Date()),
            entregador: "Amanda Ferreira",
            prioridade: "urgente",
            status: "em_rota",
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            entregueEm: null
        },
        {
            id: "PED-1003",
            cliente: "Farmácia Vida",
            telefone: "(11) 95555-3300",
            endereco: "Rua das Flores, 410 - Jardim",
            produto: "Kit primeiros socorros",
            quantidade: 5,
            valor: 85.5,
            prazoEntrega: toISODate(addDays(new Date(), -1)),
            entregador: "Bruno Lima",
            prioridade: "normal",
            status: "separacao",
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
            entregueEm: null
        }
    ];
}

function saveOrders() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
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
            .map(normalizeOrder)
            .filter((order) => typeof order.id === "string" && order.id.length > 0);
    } catch (error) {
        return [];
    }
}

function isOverdue(order) {
    if (order.status === "entregue" || order.status === "cancelado") {
        return false;
    }

    return toDateOnly(order.prazoEntrega) < toDateOnly(new Date());
}

function isCompletedToday(order) {
    if (order.status !== "entregue" || !order.entregueEm) {
        return false;
    }

    const completed = toDateOnly(order.entregueEm);
    const today = toDateOnly(new Date());
    return completed.getTime() === today.getTime();
}

function getTrimmedValue(formData, fieldName) {
    return String(formData.get(fieldName)).trim();
}

function normalizeOrder(raw) {
    const rawOrder = raw && typeof raw === "object" ? raw : {};
    const priority = priorityMap[rawOrder.prioridade] ? rawOrder.prioridade : "normal";
    const status = statusMap[rawOrder.status] ? rawOrder.status : "novo";
    const quantidade = Number(rawOrder.quantidade);
    const valor = Number(rawOrder.valor);
    const fallbackDate = toISODate(addDays(new Date(), 1));

    return {
        id: String(rawOrder.id || generateOrderId()),
        cliente: String(rawOrder.cliente || "Cliente não informado"),
        telefone: String(rawOrder.telefone || "-"),
        endereco: String(rawOrder.endereco || "-"),
        produto: String(rawOrder.produto || "Item sem nome"),
        quantidade: Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1,
        valor: Number.isFinite(valor) && valor >= 0 ? valor : 0,
        prazoEntrega: String(rawOrder.prazoEntrega || fallbackDate),
        entregador: String(rawOrder.entregador || "Não definido"),
        prioridade: priority,
        status,
        criadoEm: rawOrder.criadoEm || new Date().toISOString(),
        atualizadoEm: rawOrder.atualizadoEm || new Date().toISOString(),
        entregueEm: rawOrder.entregueEm || null
    };
}

function generateOrderId() {
    const stamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 90 + 10);
    return `PED-${stamp}-${random}`;
}

function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    return new Intl.DateTimeFormat("pt-BR").format(new Date(dateString));
}

function formatDateTime(dateString) {
    if (!dateString) {
        return "-";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(dateString));
}

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function toDateOnly(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
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
