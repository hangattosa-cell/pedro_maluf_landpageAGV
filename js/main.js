/**
 * Universo AGV - Lógica do Simulador e Interações
 */

document.addEventListener('DOMContentLoaded', () => {
  // Configurações
  const config = window.AGV_CONFIG || {
    empresaNome: 'Universo AGV',
    whatsappNumber: '5531998517129',
    mensagemDireta: 'Olá! Gostaria de tirar dúvidas sobre a Proteção Veicular Universo AGV.'
  };

  // Atualizar links diretos de WhatsApp na página
  const whatsappUrlDireto = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.mensagemDireta)}`;
  const btnFalarConsultor = document.getElementById('btn-falar-consultor');
  if (btnFalarConsultor) {
    btnFalarConsultor.href = whatsappUrlDireto;
  }

  // Estado do formulário
  const formData = {
    tipo: 'Carro', // Valor padrão selecionado
    modelo: '',
    ano: '',
    placa: '',
    nome: '',
    telefone: '',
    cidade: ''
  };

  // Elementos do DOM
  const form = document.getElementById('form-cotacao');
  const btnSubmit = document.getElementById('btn-submit');
  const modal = document.getElementById('modal-sucesso');
  const btnAbrirWhatsappModal = document.getElementById('btn-abrir-whatsapp-modal');
  const btnFecharModal = document.getElementById('btn-fechar-modal');

  // Seletores de Tipo de Veículo
  const botoesTipo = document.querySelectorAll('.opcao[data-tipo]');
  botoesTipo.forEach(btn => {
    btn.addEventListener('click', () => {
      botoesTipo.forEach(b => {
        b.classList.remove('is-on');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-on');
      btn.setAttribute('aria-pressed', 'true');
      formData.tipo = btn.getAttribute('data-tipo');
    });
  });

  // Funções Utilitárias de Formatação e Máscara
  const apenasDigitos = (val = '') => val.replace(/\D/g, '');

  const formatarPlaca = (val = '') => {
    return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  };

  const formatarTelefone = (val = '') => {
    const d = apenasDigitos(val).slice(0, 11);
    if (d.length <= 2) {
      return d.length > 0 ? `(${d}` : '';
    }
    if (d.length <= 6) {
      return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    }
    if (d.length <= 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  };

  const formatarNome = (val = '') => {
    return val.replace(/[^\p{L}\s'´`^~-]/gu, '').replace(/\s{2,}/g, ' ').slice(0, 60);
  };

  // Validações
  const validarPlaca = (placa = '') => {
    if (!placa) return true; // Opcional
    const limpa = formatarPlaca(placa);
    // Padrão antigo (ABC1234) ou Mercosul (ABC1D23)
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(limpa);
  };

  const validarTelefone = (tel = '') => {
    const d = apenasDigitos(tel);
    if (d.length !== 10 && d.length !== 11) return false;
    const ddd = parseInt(d.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;
    if (d.length === 11 && d[2] !== '9') return false;
    return true;
  };

  const validarAno = (ano = '') => {
    if (!ano) return true; // Opcional
    const n = parseInt(ano, 10);
    const anoLimite = new Date().getFullYear() + 1;
    return ano.length === 4 && n >= 1950 && n <= anoLimite;
  };

  // Inputs e Máscaras em Tempo Real
  const inputModelo = document.getElementById('input-modelo');
  const inputAno = document.getElementById('input-ano');
  const inputPlaca = document.getElementById('input-placa');
  const inputNome = document.getElementById('input-nome');
  const inputTelefone = document.getElementById('input-telefone');
  const inputCidade = document.getElementById('input-cidade');

  if (inputModelo) {
    inputModelo.addEventListener('input', (e) => {
      formData.modelo = e.target.value.trim();
    });
  }

  if (inputAno) {
    inputAno.addEventListener('input', (e) => {
      const v = apenasDigitos(e.target.value).slice(0, 4);
      e.target.value = v;
      formData.ano = v;
      limparErro('ano');
    });
  }

  if (inputPlaca) {
    inputPlaca.addEventListener('input', (e) => {
      const v = formatarPlaca(e.target.value);
      e.target.value = v;
      formData.placa = v;
      limparErro('placa');
    });
  }

  if (inputNome) {
    inputNome.addEventListener('input', (e) => {
      const v = formatarNome(e.target.value);
      e.target.value = v;
      formData.nome = v;
      limparErro('nome');
    });
  }

  if (inputTelefone) {
    inputTelefone.addEventListener('input', (e) => {
      const v = formatarTelefone(e.target.value);
      e.target.value = v;
      formData.telefone = v;
      limparErro('telefone');
    });
  }

  if (inputCidade) {
    inputCidade.addEventListener('input', (e) => {
      formData.cidade = e.target.value.trim();
    });
  }

  // Gerenciamento de Erros
  const mostrarErro = (campoId, mensagem) => {
    const input = document.getElementById(`input-${campoId}`);
    const aviso = document.getElementById(`aviso-${campoId}`);
    if (input) input.classList.add('is-erro');
    if (aviso) {
      aviso.textContent = mensagem;
      aviso.classList.add('is-erro');
    }
  };

  const limparErro = (campoId) => {
    const input = document.getElementById(`input-${campoId}`);
    const aviso = document.getElementById(`aviso-${campoId}`);
    if (input) input.classList.remove('is-erro');
    if (aviso) {
      aviso.textContent = aviso.getAttribute('data-padrao') || '';
      aviso.classList.remove('is-erro');
    }
  };

  // Envio do Formulário
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let valido = true;
      let primeiroErro = null;

      // Validação Nome
      if (!formData.nome || formData.nome.trim().length < 3) {
        mostrarErro('nome', 'Por favor, digite seu nome completo.');
        if (!primeiroErro) primeiroErro = 'nome';
        valido = false;
      }

      // Validação Telefone
      if (!validarTelefone(formData.telefone)) {
        mostrarErro('telefone', 'Informe um número de WhatsApp válido com DDD.');
        if (!primeiroErro) primeiroErro = 'telefone';
        valido = false;
      }

      // Validação Ano
      if (formData.ano && !validarAno(formData.ano)) {
        const anoMax = new Date().getFullYear() + 1;
        mostrarErro('ano', `Digite um ano válido entre 1950 e ${anoMax}.`);
        if (!primeiroErro) primeiroErro = 'ano';
        valido = false;
      }

      // Validação Placa
      if (formData.placa && !validarPlaca(formData.placa)) {
        mostrarErro('placa', 'Placa incompleta. Se não tiver em mãos, pode deixar em branco.');
        if (!primeiroErro) primeiroErro = 'placa';
        valido = false;
      }

      if (!valido) {
        const elem = document.getElementById(`campo-${primeiroErro}`);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = document.getElementById(`input-${primeiroErro}`);
          if (input) input.focus();
        }
        return;
      }

      // Desabilitar botão e mostrar loading
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `
        <span class="cta__spin" aria-hidden="true"></span>
        Gerando sua cotação...
      `;

      // Montar mensagem para WhatsApp
      const saudacao = `Olá! Gostaria de receber uma cotação de proteção veicular pela Universo AGV.`;
      const mensagemWhatsApp = `${saudacao}

📋 *DADOS DO VEÍCULO:*
• *Tipo:* ${formData.tipo || 'Não informado'}
• *Modelo:* ${formData.modelo || 'Não informado'}
• *Ano:* ${formData.ano || 'Não informado'}
• *Placa:* ${formData.placa || 'Não informada'}

👤 *MEUS DADOS:*
• *Nome:* ${formData.nome}
• *WhatsApp:* ${formData.telefone}
• *Cidade:* ${formData.cidade || 'Não informada'}

Aguardo as opções de planos e valores!`;

      const whatsappUrlFinal = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(mensagemWhatsApp)}`;

      // Salvar lead na sessionStorage
      try {
        sessionStorage.setItem('agv_lead', JSON.stringify({
          ...formData,
          dataEnvio: new Date().toISOString()
        }));
      } catch (err) {
        console.warn('Não foi possível salvar na sessionStorage', err);
      }

      // Enviar Webhook se configurado
      if (config.webhookUrl) {
        try {
          await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            keepalive: true
          });
        } catch (err) {
          console.warn('Webhook falhou ou bloqueado:', err);
        }
      }

      // Disparar evento de conversão Meta Pixel se ativo
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          tipo: formData.tipo,
          modelo: formData.modelo
        });
      }

      // Configurar botão do modal e abrir modal
      if (btnAbrirWhatsappModal) {
        btnAbrirWhatsappModal.href = whatsappUrlFinal;
      }

      setTimeout(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `
          Quero minha cotação
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path d="M5 12h13m0 0-5.2-5.2M18 12l-5.2 5.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;

        if (modal) {
          modal.classList.add('is-open');
        }

        // Tenta abrir o WhatsApp automaticamente em nova aba
        window.open(whatsappUrlFinal, '_blank');
      }, 500);
    });
  }

  // Fechar Modal
  if (btnFecharModal && modal) {
    btnFecharModal.addEventListener('click', () => {
      modal.classList.remove('is-open');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
      }
    });
  }

  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq__question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        // Fecha os demais
        faqItems.forEach(i => i.classList.remove('is-open'));
        // Alterna o atual
        if (!isOpen) {
          item.classList.add('is-open');
        }
      });
    }
  });
});
