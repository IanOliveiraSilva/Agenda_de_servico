document.addEventListener('DOMContentLoaded', function() {
    const DOM = {
        calendarDays: document.getElementById('calendar-days'),
        currentMonthElement: document.getElementById('current-month'),
        prevMonthBtn: document.getElementById('prev-month'),
        nextMonthBtn: document.getElementById('next-month'),
        addAppointmentBtn: document.getElementById('add-appointment'),
        appointmentModal: document.getElementById('appointment-modal'),
        detailsModal: document.getElementById('details-modal'),
        appointmentForm: document.getElementById('appointment-form'),
        closeButtons: document.querySelectorAll('.close'),
        cancelAppointmentBtn: document.getElementById('cancel-appointment'),
        serviceTypeSelect: document.getElementById('service-type'),
        serviceIconPreview: document.getElementById('service-icon-preview'),
        detailServiceIcon: document.getElementById('detail-service-icon'),
        totalAppointmentsElement: document.getElementById('total-appointments'),
        completedAppointmentsElement: document.getElementById('completed-appointments'),
        pendingAppointmentsElement: document.getElementById('pending-appointments'),
        urgentAppointmentsElement: document.getElementById('urgent-appointments'),
        formInputs: {
            clientName: document.getElementById('client-name'),
            clientPhone: document.getElementById('client-phone'),
            serviceType: document.getElementById('service-type'),
            residenceType: document.getElementById('residence-type'),
            appointmentDate: document.getElementById('appointment-date'),
            appointmentTime: document.getElementById('appointment-time'),
            clientAddress: document.getElementById('client-address'),
            notes: document.getElementById('notes')
        },
        detailElements: {
            client: document.getElementById('detail-client'),
            service: document.getElementById('detail-service'),
            residence: document.getElementById('detail-residence'),
            date: document.getElementById('detail-date'),
            time: document.getElementById('detail-time'),
            phone: document.getElementById('detail-phone'),
            address: document.getElementById('detail-address'),
            notes: document.getElementById('detail-notes')
        }
    };

    const CONFIG = {
        serviceIcons: {
            'Manutenção_Preventiva': 'fas fa-shield-alt',
            'Vazamento_Gas': 'fas fa-exclamation-triangle',
            'Instalacao': 'fas fa-box-open',
            'Limpeza': 'fas fa-broom',
            'Limpeza_Parcial': 'fas fa-broom'
        },
        serviceColors: {
            'Manutenção_Preventiva': '#4cc9f0',
            'Vazamento_Gas': '#ef233c',
            'Instalacao': '#f8961e',
            'Limpeza': '#4361ee',
            'Limpeza_Parcial': '#4895ef'
        },
        serviceNames: {
            'Manutenção_Preventiva': 'Manutenção Preventiva',
            'Vazamento_Gas': 'Vazamento de Gás',
            'Instalacao': 'Instalação',
            'Limpeza': 'Limpeza Completa',
            'Limpeza_Parcial': 'Limpeza Parcial'
        },
        monthNames: [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezember'
        ]
    };

    const state = {
        currentDate: new Date(),
        appointments: JSON.parse(localStorage.getItem('ac-appointments')) || [],
        selectedAppointment: null
    };

    function init() {
        if (state.appointments.length === 0) {
        }
        setupEventListeners();
        renderCalendar();
        updateStats();
    }

    function setupEventListeners() {
        DOM.prevMonthBtn.addEventListener('click', () => {
            state.currentDate.setMonth(state.currentDate.getMonth() - 1);
            renderCalendar();
        });
        
        DOM.nextMonthBtn.addEventListener('click', () => {
            state.currentDate.setMonth(state.currentDate.getMonth() + 1);
            renderCalendar();
        });
        
        DOM.addAppointmentBtn.addEventListener('click', openAppointmentModal);
        DOM.cancelAppointmentBtn.addEventListener('click', () => closeModal(DOM.appointmentModal));
        DOM.appointmentForm.addEventListener('submit', handleFormSubmit);
        
        DOM.serviceTypeSelect.addEventListener('change', function() {
            updateServiceIcon(this.value, DOM.serviceIconPreview);
        });
        
        DOM.closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (DOM.appointmentModal.style.display === 'block') {
                    closeModal(DOM.appointmentModal);
                } else {
                    closeModal(DOM.detailsModal);
                }
            });
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === DOM.appointmentModal) {
                closeModal(DOM.appointmentModal);
            }
            if (event.target === DOM.detailsModal) {
                closeModal(DOM.detailsModal);
            }
        });

        document.getElementById('edit-appointment').addEventListener('click', editAppointment);
        document.getElementById('delete-appointment').addEventListener('click', deleteAppointment);
    }

    function editAppointment() {
        if (!state.selectedAppointment) return;
        
        closeModal(DOM.detailsModal);
        openModal(DOM.appointmentModal);
        fillFormWithAppointment(state.selectedAppointment);
        
        DOM.appointmentForm.classList.add('editing');
        document.getElementById('save-appointment').textContent = 'Atualizar Agendamento';
    }

    function deleteAppointment() {
        if (!state.selectedAppointment) return;
        
        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            state.appointments = state.appointments.filter(
                app => app.id !== state.selectedAppointment.id
            );
            
            saveAppointments();
            closeModal(DOM.detailsModal);
            renderCalendar();
            updateStats();
            showNotification('Agendamento excluído com sucesso!', 'success');
        }
    }

    function renderCalendar() {
        DOM.currentMonthElement.textContent = 
            `${CONFIG.monthNames[state.currentDate.getMonth()]} ${state.currentDate.getFullYear()}`;
        
        DOM.calendarDays.innerHTML = '';
        
        const firstDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
        const lastDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0);
        const today = new Date();
        const isCurrentMonth = state.currentDate.getMonth() === today.getMonth() && 
                              state.currentDate.getFullYear() === today.getFullYear();
        
        const startDay = firstDay.getDay();
        const prevMonthLastDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            DOM.calendarDays.appendChild(createDayElement(prevMonthLastDay - i, true));
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = createDayElement(i, false, isCurrentMonth && i === today.getDate());
            
            getAppointmentsForDay(i).forEach(app => {
                dayElement.appendChild(createAppointmentElement(app));
            });
            
            DOM.calendarDays.appendChild(dayElement);
        }
        
        const daysShown = startDay + lastDay.getDate();
        const remainingDays = 7 - (daysShown % 7);
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                DOM.calendarDays.appendChild(createDayElement(i, true));
            }
        }
    }
    
    function updateStats() {
        const today = new Date();
        
        DOM.totalAppointmentsElement.textContent = state.appointments.length;
        
        const completed = state.appointments.filter(app => app.status === 'completed').length;
        DOM.completedAppointmentsElement.textContent = completed;
        
        const pending = state.appointments.filter(app => app.status === 'pending').length;
        DOM.pendingAppointmentsElement.textContent = pending;
        
        const urgent = state.appointments.filter(app => {
            const appDate = new Date(app.date);
            const diffTime = appDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 2 && app.status === 'pending';
        }).length;
        DOM.urgentAppointmentsElement.textContent = urgent;
    }
    
    function openAppointmentModal() {
        state.selectedAppointment = null;
        resetForm();
        
        const today = new Date().toISOString().split('T')[0];
        DOM.formInputs.appointmentDate.value = today;
        
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const formattedTime = `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}`;
        DOM.formInputs.appointmentTime.value = formattedTime;
        
        openModal(DOM.appointmentModal);
    }
    
    function showAppointmentDetails(appointment) {
        state.selectedAppointment = appointment;
        
        updateServiceIcon(appointment.serviceType, DOM.detailServiceIcon);
        
        DOM.detailElements.client.textContent = appointment.clientName;
        DOM.detailElements.service.textContent = CONFIG.serviceNames[appointment.serviceType] || appointment.serviceType;
        DOM.detailElements.residence.textContent = appointment.residenceType;
        DOM.detailElements.date.textContent = formatDate(new Date(appointment.date));
        DOM.detailElements.time.textContent = appointment.time;
        DOM.detailElements.phone.textContent = appointment.phone || 'Não informado';
        DOM.detailElements.address.textContent = appointment.address || 'Não informado';
        DOM.detailElements.notes.textContent = appointment.notes || 'Nenhuma observação';
        
        openModal(DOM.detailsModal);
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: state.selectedAppointment ? state.selectedAppointment.id : Date.now().toString(),
            clientName: DOM.formInputs.clientName.value.trim(),
            serviceType: DOM.formInputs.serviceType.value,
            residenceType: DOM.formInputs.residenceType.value,
            date: DOM.formInputs.appointmentDate.value,
            time: DOM.formInputs.appointmentTime.value,
            phone: DOM.formInputs.clientPhone.value.trim(),
            address: DOM.formInputs.clientAddress.value.trim(),
            notes: DOM.formInputs.notes.value.trim(),
            status: state.selectedAppointment ? state.selectedAppointment.status : 'pending',
            createdAt: state.selectedAppointment ? state.selectedAppointment.createdAt : new Date().toISOString()
        };

        if (!formData.clientName || !formData.serviceType || !formData.residenceType || 
            !formData.date || !formData.time) {
            showNotification('Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        if (state.selectedAppointment) {
            const index = state.appointments.findIndex(
                app => app.id === state.selectedAppointment.id
            );
            state.appointments[index] = formData;
            showNotification('Agendamento atualizado com sucesso!', 'success');
        } else {
            state.appointments.push(formData);
            showNotification('Agendamento criado com sucesso!', 'success');
        }
        
        saveAppointments();
        closeModal(DOM.appointmentModal);
        renderCalendar();
        updateStats();
        
        DOM.appointmentForm.classList.remove('editing');
        document.getElementById('save-appointment').textContent = 'Salvar Agendamento';
    }

    function createDayElement(dayNumber, isOtherMonth, isToday = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        if (isOtherMonth) dayElement.classList.add('other-month');
        if (isToday) dayElement.classList.add('today');
        
        const dayNumberElement = document.createElement('div');
        dayNumberElement.className = 'day-number';
        dayNumberElement.textContent = dayNumber;
        dayElement.appendChild(dayNumberElement);
        
        return dayElement;
    }
    
    function createAppointmentElement(appointment) {
        const appElement = document.createElement('div');
        appElement.className = `appointment ${appointment.serviceType}`;
        appElement.textContent = `${appointment.clientName} - ${CONFIG.serviceNames[appointment.serviceType] || appointment.serviceType}`;
        appElement.addEventListener('click', () => showAppointmentDetails(appointment));
        return appElement;
    }
    
    function getAppointmentsForDay(day) {
        return state.appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate.getDate() === day && 
                   appDate.getMonth() === state.currentDate.getMonth() && 
                   appDate.getFullYear() === state.currentDate.getFullYear();
        });
    }
    
    function updateServiceIcon(serviceType, iconElement) {
        iconElement.className = 'service-icon';
        
        if (serviceType && CONFIG.serviceIcons[serviceType]) {
            iconElement.innerHTML = `<i class="${CONFIG.serviceIcons[serviceType]}"></i>`;
            iconElement.style.backgroundColor = CONFIG.serviceColors[serviceType] || '#4361ee';
        } else {
            iconElement.innerHTML = '<i class="fas fa-tools"></i>';
            iconElement.style.backgroundColor = '#4361ee';
        }
    }
    
    function formatDate(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('pt-BR', options);
    }
    
    function openModal(modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    function closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    function fillFormWithAppointment(appointment) {
        DOM.formInputs.clientName.value = appointment.clientName;
        DOM.formInputs.serviceType.value = appointment.serviceType;
        DOM.formInputs.residenceType.value = appointment.residenceType;
        DOM.formInputs.appointmentDate.value = appointment.date;
        DOM.formInputs.appointmentTime.value = appointment.time;
        DOM.formInputs.clientPhone.value = appointment.phone || '';
        DOM.formInputs.clientAddress.value = appointment.address || '';
        DOM.formInputs.notes.value = appointment.notes || '';
        
        updateServiceIcon(appointment.serviceType, DOM.serviceIconPreview);
    }
    
    function resetForm() {
        DOM.appointmentForm.reset();
        updateServiceIcon('', DOM.serviceIconPreview);
    }
    
    function saveAppointments() {
        localStorage.setItem('ac-appointments', JSON.stringify(state.appointments));
    }
    
    function showNotification(message, type = 'success') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    init();
});