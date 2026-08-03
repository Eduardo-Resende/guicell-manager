const nodemailer = require('nodemailer');
const axios = require('axios');

exports.enviarEmail = async (req, res) => {
  try {
    const { id_os, email, numero_os, pdf_base64 } = req.body;

    if (!email || !pdf_base64) {
      return res.status(400).json({ error: 'E-mail e arquivo PDF são obrigatórios.' });
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ error: 'Servidor de e-mail não configurado no backend.' });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || 465,
      secure: SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Guicell Manager" <${SMTP_USER}>`,
      to: email,
      subject: `Ordem de Serviço #${numero_os} - Guicell Assistência Técnica`,
      text: `Olá!\n\nSegue em anexo a sua Ordem de Serviço #${numero_os}.\n\nAtenciosamente,\nGuicell Assistência Técnica`,
      attachments: [
        {
          filename: `OS-${numero_os}.pdf`,
          content: pdf_base64,
          encoding: 'base64',
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'E-mail enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Falha ao enviar e-mail. Verifique as configurações.' });
  }
};

exports.enviarWhatsapp = async (req, res) => {
  try {
    const { id_os, telefone, numero_os, pdf_base64 } = req.body;

    if (!telefone || !pdf_base64) {
      return res.status(400).json({ error: 'Telefone e arquivo PDF são obrigatórios.' });
    }

    const { WHATSAPP_API_URL, WHATSAPP_API_KEY, WHATSAPP_INSTANCE } = process.env;
    if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY || !WHATSAPP_INSTANCE) {
      return res.status(500).json({ error: 'API do WhatsApp não configurada no backend.' });
    }

    // Formata o número (garantir que só tem números e começa com código do país, ex: 55)
    let numeroFormatado = telefone.replace(/\D/g, '');
    if (!numeroFormatado.startsWith('55') && numeroFormatado.length <= 11) {
      numeroFormatado = '55' + numeroFormatado;
    }

    // Endpoint da Evolution API v2 para envio de arquivos
    const url = `${WHATSAPP_API_URL}/message/sendMedia/${WHATSAPP_INSTANCE}`;
    
    const pureBase64 = pdf_base64.includes('base64,') ? pdf_base64.split('base64,')[1] : pdf_base64;

    // Payload formatado para Evolution API v2
    const payload = {
      number: numeroFormatado,
      media: pureBase64,
      mediatype: "document",
      mimetype: "application/pdf",
      fileName: `OS-${numero_os || 'doc'}.pdf`,
      caption: `Olá! Segue o PDF da sua Ordem de Serviço #${numero_os || ''} da Guicell Assistência Técnica.`
    };

    const config = {
      headers: {
        'apikey': WHATSAPP_API_KEY,
        'Content-Type': 'application/json',
        'Origin': WHATSAPP_API_URL
      }
    };

    await axios.post(url, payload, config);

    res.json({ message: 'WhatsApp enviado com sucesso.' });
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('Erro ao enviar WhatsApp:', errorData);
    res.status(500).json({ 
      error: 'Falha ao enviar WhatsApp.',
      details: typeof errorData === 'object' ? JSON.stringify(errorData) : errorData
    });
  }
};
