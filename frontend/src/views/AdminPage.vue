<template>
  <section class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="dot"></span>
        <div>
          <strong>Dashboard</strong>
          <small>Seu Cantinho</small>
        </div>
      </div>
      <nav class="sidebar-menu">
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin' }" to="/admin">Visão geral</RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-users' }" to="/admin/users">
          Usuários
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-tenants' }" to="/admin/tenants">
          Filiais
        </RouterLink>
        <RouterLink class="menu-item" :class="{ active: $route.name === 'admin-spaces' }" to="/admin/spaces">
          Espaços
        </RouterLink>
        <a class="menu-item disabled" href="#">Reservas</a>
        <a class="menu-item disabled" href="#">Financeiro</a>
      </nav>
    </aside>

    <div class="admin-content">
      <div class="admin-grid">
        <div class="card tall">
          <div class="card-header">
            <h3>Locais em destaque</h3>
            <button class="pill small" type="button">Ver todos</button>
          </div>
          <ul class="list">
            <li>
              <div>
                <strong>Salão Centro Histórico</strong>
                <p class="muted">Capacidade 150 · Disponível</p>
              </div>
              <span class="pill">R$ 280</span>
            </li>
            <li>
              <div>
                <strong>Chácara Flor do Campo</strong>
                <p class="muted">Capacidade 200 · Reservas ativas</p>
              </div>
              <span class="pill">R$ 320</span>
            </li>
            <li>
              <div>
                <strong>Auditório Curitiba</strong>
                <p class="muted">Capacidade 80 · Disponível</p>
              </div>
              <span class="pill">R$ 180</span>
            </li>
          </ul>
        </div>

        <div class="card chart">
          <div class="card-header">
            <h3>Financeiro</h3>
            <span class="muted">Entradas dos últimos 30 dias</span>
          </div>
          <div class="chart-placeholder">[Gráfico de linhas/colunas]</div>
        </div>

        <div class="card calendar">
          <div class="card-header">
            <h3>Agenda</h3>
            <span class="muted">Reservas da semana</span>
          </div>
          <div class="calendar-placeholder">
            <div class="day">
              <strong>Seg</strong>
              <span>2 reservas</span>
            </div>
            <div class="day">
              <strong>Ter</strong>
              <span>1 reserva</span>
            </div>
            <div class="day">
              <strong>Qua</strong>
              <span>3 reservas</span>
            </div>
            <div class="day">
              <strong>Qui</strong>
              <span>1 reserva</span>
            </div>
            <div class="day">
              <strong>Sex</strong>
              <span>2 reservas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
