document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const calendarDays = document.getElementById('calendar-days');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const addAppointmentBtn = document.getElementById('add-appointment');
    const appointmentModal = document.getElementById('appointment-modal');
    const detailsModal = document.getElementById('details-modal');
    const appointmentForm = document.getElementById('appointment-form');
    const closeButtons = document.querySelectorAll('.close');
    const cancelAppointmentBtn = document.getElementById('cancel-appointment');
    const closeDetailsBtn = document.getElementById('close-details');
    
    // Variáveis de estado
    let currentDate = new Date();
    let appointments = JSON.parse(localStorage.getItem('ac-appointments')) || [];
    let selectedAppointment = null;
    
    // Inicialização
    renderCalendar();
    
    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    addAppointmentBtn.addEventListener('click', () => {
        selectedAppointment = null;
        resetForm();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointment-date').value = today;
        appointmentModal.style.display = 'block';
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            appointmentModal.style.display = 'none';
            detailsModal.style.display = 'none';
        });
    });
    
    cancelAppointmentBtn.addEventListener('click', () => {
        appointmentModal.style.display = 'none';
    });
    
    closeDetailsBtn.addEventListener('click', () => {
        detailsModal.style.display = 'none';
    });
    
    appointmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveAppointment();
    });
    
    document.getElementById('edit-appointment').addEventListener('click', function() {
        detailsModal.style.display = 'none';
        appointmentModal.style.display = 'block';
        fillFormWithAppointment(selectedAppointment);
    });
    
    document.getElementById('delete-appointment').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
            appointments = appointments.filter(app => app.id !== selectedAppointment.id);
            saveAppointments();
            detailsModal.style.display = 'none';
            renderCalendar();
        }
    });
    
    // Funções
    function renderCalendar() {
        // Atualiza o cabeçalho com o mês/ano atual
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        currentMonthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        
        // Limpa o calendário
        calendarDays.innerHTML = '';
        
        // Obtém o primeiro dia do mês e o último dia do mês
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Obtém o dia da semana do primeiro dia (0-6, onde 0 é domingo)
        const startDay = firstDay.getDay();
        
        // Obtém o dia de hoje para destacar
        const today = new Date();
        const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                              currentDate.getFullYear() === today.getFullYear();
        
        // Adiciona dias do mês anterior (se necessário)
        const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const dayElement = createDayElement(prevMonthLastDay - i, true);
            calendarDays.appendChild(dayElement);
        }
        
        // Adiciona dias do mês atual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const isToday = isCurrentMonth && i === today.getDate();
            const dayElement = createDayElement(i, false, isToday);
            
            // Adiciona os agendamentos deste dia
            const dayAppointments = getAppointmentsForDay(i);
            dayAppointments.forEach(app => {
                const appElement = document.createElement('div');
                appElement.className = `appointment ${app.serviceType.toLowerCase().replace(' ', '-')}`;
                appElement.textContent = `${app.clientName} - ${app.serviceType}`;
                appElement.addEventListener('click', () => showAppointmentDetails(app));
                dayElement.appendChild(appElement);
            });
            
            calendarDays.appendChild(dayElement);
        }
        
        // Adiciona dias do próximo mês (se necessário)
        const daysShown = startDay + lastDay.getDate();
        const remainingDays = 7 - (daysShown % 7);
        if (remainingDays < 7) {
            for (let i = 1; i <= remainingDays; i++) {
                const dayElement = createDayElement(i, true);
                calendarDays.appendChild(dayElement);
            }
        }
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
    
    function getAppointmentsForDay(day) {
        return appointments.filter(app => {
            const appDate = new Date(app.date);
            return appDate.getDate() === day && 
                   appDate.getMonth() === currentDate.getMonth() && 
                   appDate.getFullYear() === currentDate.getFullYear();
        });
    }
    
    function saveAppointment() {
        const formData = {
            id: selectedAppointment ? selectedAppointment.id : Date.now().toString(),
            clientName: document.getElementById('client-name').value,
            serviceType: document.getElementById('service-type').value,
            residenceType: document.getElementById('residence-type').value,
            date: document.getElementById('appointment-date').value,
            time: document.getElementById('appointment-time').value,
            phone: document.getElementById('client-phone').value,
            address: document.getElementById('client-address').value,
            notes: document.getElementById('notes').value
        };
        
        if (selectedAppointment) {
            // Atualiza o agendamento existente
            const index = appointments.findIndex(app => app.id === selectedAppointment.id);
            appointments[index] = formData;
        } else {
            // Adiciona novo agendamento
            appointments.push(formData);
        }
        
        saveAppointments();
        appointmentModal.style.display = 'none';
        renderCalendar();
    }
    
    function saveAppointments() {
        localStorage.setItem('ac-appointments', JSON.stringify(appointments));
    }
    
    function showAppointmentDetails(appointment) {
        selectedAppointment = appointment;
        
        // Preenche os detalhes
        document.getElementById('detail-client').textContent = appointment.clientName;
        document.getElementById('detail-service').textContent = appointment.serviceType;
        document.getElementById('detail-residence').textContent = appointment.residenceType;
        
        const formattedDate = new Date(appointment.date).toLocaleDateString('pt-BR');
        document.getElementById('detail-date').textContent = formattedDate;
        
        document.getElementById('detail-time').textContent = appointment.time;
        document.getElementById('detail-phone').textContent = appointment.phone || 'Não informado';
        document.getElementById('detail-address').textContent = appointment.address || 'Não informado';
        document.getElementById('detail-notes').textContent = appointment.notes || 'Nenhuma observação';
        
        detailsModal.style.display = 'block';
    }
    
    function fillFormWithAppointment(appointment) {
        document.getElementById('client-name').value = appointment.clientName;
        document.getElementById('service-type').value = appointment.serviceType;
        document.getElementById('residence-type').value = appointment.residenceType;
        document.getElementById('appointment-date').value = appointment.date;
        document.getElementById('appointment-time').value = appointment.time;
        document.getElementById('client-phone').value = appointment.phone || '';
        document.getElementById('client-address').value = appointment.address || '';
        document.getElementById('notes').value = appointment.notes || '';
    }
    
    function resetForm() {
        appointmentForm.reset();
    }
    
    // Fecha o modal se clicar fora dele
    window.addEventListener('click', function(event) {
        if (event.target === appointmentModal) {
            appointmentModal.style.display = 'none';
        }
        if (event.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });
});