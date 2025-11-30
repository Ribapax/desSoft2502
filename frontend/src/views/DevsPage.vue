<template>
  <section class="section devs page-view">
    <div class="badge">Desenvolvedores</div>
    <h2>API e integrações para a equipe técnica</h2>
    <div class="dev-grid">
      <div class="card">
        <h4>Base URL</h4>
        <p><code>http://localhost:3333/api</code></p>
        <p class="muted">Troque para o host da sua instância quando subir em produção.</p>
      </div>
      <div class="card">
        <h4>Documentação</h4>
        <p>
          Swagger disponível em <a href="http://localhost:3333/docs" target="_blank" rel="noreferrer">/docs</a>, com
          schemas validados por Zod no backend.
        </p>
      </div>
      <div class="card">
        <h4>Recursos principais</h4>
        <ul>
          <li>/users — criar e listar pessoas usuárias</li>
          <li>/spaces — cadastro de espaços e lotação</li>
          <li>/reservations — agendamento com anti double-booking</li>
          <li>/payments — registro de sinal e pagamento total</li>
        </ul>
      </div>
    </div>
    <div class="cta-row spaced">
      <a class="btn btn-primary" href="http://localhost:3333/docs" target="_blank" rel="noreferrer">Ver API em ação</a>
      <router-link class="btn btn-secondary" to="/">Voltar para a home</router-link>
    </div>
  </section>
</template>
