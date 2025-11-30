<script setup lang="ts"></script>

<template>
  <section class="page-view">
    <section class="hero">
      <div>
        <span class="badge">
          <span>Seu Cantinho</span>
          <span class="pill">Nova experiência</span>
        </span>
        <h1>Gestão de reservas clara, rápida e sem conflitos.</h1>
        <p class="lead">
          Visualize espaços, crie reservas e acompanhe pagamentos em um painel único. Roles de acesso, disponibilidade
          em tempo real e integrações com a API do projeto.
        </p>
        <div class="cta-row">
          <router-link class="btn btn-primary" to="/sobre">Conheça o projeto</router-link>
          <a class="btn btn-secondary" href="#features">Explorar recursos</a>
        </div>
        <div class="metrics">
          <div class="metric">
            <strong>Reserva segura</strong>
            <span>Validação anti double-booking na camada de negócio.</span>
          </div>
          <div class="metric">
            <strong>Perfis e regras</strong>
            <span>Separação de acessos para clientes e operação.</span>
          </div>
          <div class="metric">
            <strong>Pagamentos</strong>
            <span>Fluxo de sinal e confirmação rastreável.</span>
          </div>
        </div>
      </div>
      <div class="panel">
        <span class="pill">Visão diária</span>
        <h3>Disponibilidade do coworking</h3>
        <ul>
          <li>09h — Sala Criativa — Reservada</li>
          <li>11h — Auditório — Disponível</li>
          <li>14h — Estúdio — Reservada (pagamento pendente)</li>
          <li>17h — Terraço — Disponível</li>
        </ul>
      </div>
    </section>

    <section id="features" class="section">
      <div class="badge">Pronto para produção</div>
      <h2>Experiência completa para clientes e operação</h2>
      <div class="features">
        <article class="card">
          <h4>Self-service com segurança</h4>
          <p>Clientes autenticados podem reservar slots disponíveis e acompanhar status em tempo real.</p>
        </article>
        <article class="card">
          <h4>Operação em camadas</h4>
          <p>Perfis de atendente e gestor controlam ajustes finos de disponibilidade, bloqueios e preços.</p>
        </article>
        <article class="card">
          <h4>Pagamentos integrados</h4>
          <p>Registro de sinal e confirmação ligado a cada reserva, com trilha de auditoria completa.</p>
        </article>
        <article class="card">
          <h4>API pronta para integradores</h4>
          <p>Documentação Swagger, validação Zod e proteção contra conflitos direto na camada de serviço.</p>
        </article>
      </div>
    </section>
  </section>
</template>
