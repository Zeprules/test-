// Health & Safety Incident Logger Application

class IncidentLogger {
    constructor() {
        this.incidents = this.loadIncidents();
        this.initElements();
        this.bindEvents();
        this.renderIncidents();
        this.setDefaultDate();
    }

    initElements() {
        this.form = document.getElementById('incident-form');
        this.incidentList = document.getElementById('incident-list');
        this.severityFilter = document.getElementById('severity-filter');
        this.clearAllBtn = document.getElementById('clear-all');
        this.modal = document.getElementById('modal');
        this.modalBody = document.getElementById('modal-body');
        this.modalClose = document.querySelector('.modal-close');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.severityFilter.addEventListener('change', () => this.renderIncidents());
        this.clearAllBtn.addEventListener('click', () => this.clearAllIncidents());
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('incident-date').value = today;

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('incident-time').value = `${hours}:${minutes}`;
    }

    loadIncidents() {
        const stored = localStorage.getItem('incidents');
        return stored ? JSON.parse(stored) : [];
    }

    saveIncidents() {
        localStorage.setItem('incidents', JSON.stringify(this.incidents));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const incident = {
            id: this.generateId(),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location'),
            description: formData.get('description'),
            injuryType: formData.get('injuryType'),
            severity: formData.get('severity'),
            personInvolved: formData.get('personInvolved'),
            witnesses: formData.get('witnesses'),
            createdAt: new Date().toISOString()
        };

        this.incidents.unshift(incident);
        this.saveIncidents();
        this.renderIncidents();
        this.form.reset();
        this.setDefaultDate();
        this.showToast('Incident logged successfully');
    }

    deleteIncident(id) {
        if (confirm('Are you sure you want to delete this incident?')) {
            this.incidents = this.incidents.filter(inc => inc.id !== id);
            this.saveIncidents();
            this.renderIncidents();
            this.showToast('Incident deleted');
        }
    }

    clearAllIncidents() {
        if (confirm('Are you sure you want to delete ALL incidents? This cannot be undone.')) {
            this.incidents = [];
            this.saveIncidents();
            this.renderIncidents();
            this.showToast('All incidents cleared');
        }
    }

    getFilteredIncidents() {
        const filter = this.severityFilter.value;
        if (!filter) return this.incidents;
        return this.incidents.filter(inc => inc.severity === filter);
    }

    formatDate(dateStr) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('en-US', options);
    }

    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    getSeverityLabel(severity) {
        const labels = {
            'minor': 'Minor',
            'moderate': 'Moderate',
            'serious': 'Serious',
            'critical': 'Critical',
            'near-miss': 'Near Miss'
        };
        return labels[severity] || severity;
    }

    getInjuryTypeLabel(type) {
        const labels = {
            'none': 'No Injury',
            'cut': 'Cut / Laceration',
            'bruise': 'Bruise / Contusion',
            'sprain': 'Sprain / Strain',
            'fracture': 'Fracture',
            'burn': 'Burn',
            'chemical': 'Chemical Exposure',
            'eye': 'Eye Injury',
            'respiratory': 'Respiratory Issue',
            'electric': 'Electric Shock',
            'other': 'Other'
        };
        return labels[type] || type || 'Not specified';
    }

    renderIncidents() {
        const incidents = this.getFilteredIncidents();

        if (incidents.length === 0) {
            this.incidentList.innerHTML = '<p class="no-incidents">No incidents logged yet.</p>';
            return;
        }

        this.incidentList.innerHTML = incidents.map(incident => `
            <div class="incident-card severity-${incident.severity}" data-id="${incident.id}">
                <div class="incident-header">
                    <span class="incident-datetime">
                        ${this.formatDate(incident.date)} at ${this.formatTime(incident.time)}
                    </span>
                    <span class="severity-badge ${incident.severity}">
                        ${this.getSeverityLabel(incident.severity)}
                    </span>
                </div>
                <div class="incident-location">
                    <strong>Location:</strong> ${this.escapeHtml(incident.location)}
                </div>
                <div class="incident-person">
                    <strong>Person Involved:</strong> ${this.escapeHtml(incident.personInvolved)}
                </div>
                <div class="incident-description">
                    ${this.escapeHtml(incident.description)}
                </div>
                <div class="incident-actions">
                    <button class="btn-delete" onclick="event.stopPropagation(); app.deleteIncident('${incident.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Add click handlers for viewing details
        document.querySelectorAll('.incident-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const id = card.dataset.id;
                    this.showIncidentDetails(id);
                }
            });
        });
    }

    showIncidentDetails(id) {
        const incident = this.incidents.find(inc => inc.id === id);
        if (!incident) return;

        this.modalBody.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Date & Time</div>
                <div class="detail-value">${this.formatDate(incident.date)} at ${this.formatTime(incident.time)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Location</div>
                <div class="detail-value">${this.escapeHtml(incident.location)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Person Involved</div>
                <div class="detail-value">${this.escapeHtml(incident.personInvolved)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Severity</div>
                <div class="detail-value">
                    <span class="severity-badge ${incident.severity}">
                        ${this.getSeverityLabel(incident.severity)}
                    </span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Injury Type</div>
                <div class="detail-value">${this.getInjuryTypeLabel(incident.injuryType)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Description</div>
                <div class="detail-value">${this.escapeHtml(incident.description)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Witnesses</div>
                <div class="detail-value">${this.escapeHtml(incident.witnesses) || 'None listed'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Logged On</div>
                <div class="detail-value">${new Date(incident.createdAt).toLocaleString()}</div>
            </div>
        `;

        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize the application
const app = new IncidentLogger();
