# Requisitos do Sistema NAVE

Este documento é uma transcrição em Markdown do artefato de requisitos do projeto. A conversão removeu metadados do arquivo original e preservou o conteúdo funcional.

## Requisitos funcionais

| ID | Requisito | Descrição | Prioridade |
| --- | --- | --- | --- |
| RF001 | Gerenciamento de profissionais | A pessoa gestora cadastra, edita, remove e consulta profissionais no sistema. | Alta |
| RF002 | Gerenciamento de beneficiárias | A pessoa gestora cadastra, edita, remove e consulta beneficiárias no sistema. | Alta |
| RF003 | Cadastro de queixas | A pessoa triadora registra a queixa inicial da beneficiária durante a triagem. | Alta |
| RF004 | Gerenciamento de agenda (atendimentos) | A pessoa triadora gerencia a agenda de reuniões da beneficiária: agendar, editar e excluir. | Alta |
| RF005 | Encaminhamento da triagem | A pessoa gestora ou triadora encaminha a beneficiária para um serviço, como Psicologia, Assistência Social ou anamnese. | Alta |
| RF006 | Visualização de agenda por profissional | A pessoa profissional visualiza sua agenda de atendimentos filtrada por data e status. | Alta |
| RF007 | Registro de atendimento (prontuário) | A pessoa profissional registra atendimentos no prontuário da beneficiária com data, tipo e descrição. | Alta |
| RF008 | Consulta de histórico da beneficiária | A pessoa gestora ou profissional consulta o histórico de triagens, encaminhamentos e atendimentos da beneficiária. | Alta |
| RF009 | Controle de doações financeiras | A pessoa gestora registra doações com tipo, valor ou quantidade, data, doador e observação. | Alta |
| RF010 | Gerenciamento de bazares | A pessoa gestora registra bazares com data, local, arrecadação e observações, além de consultar o histórico semanal. | Alta |
| RF011 | Dashboard e gráficos | O sistema exibe gráficos e resumos de atendimentos por período, doações por mês e bazares por semana. | Média |
| RF012 | Visualização de prontuário | A pessoa profissional pode visualizar o prontuário completo da beneficiária, conforme as regras de acesso. | Alta |

## Requisitos não funcionais

| ID | Requisito | Descrição | Prioridade |
| --- | --- | --- | --- |
| RNF001 | Autenticação de usuários | O sistema deve exigir login e senha para acesso às funcionalidades. | Alta |
| RNF002 | Controle de acesso | O sistema deve permitir pelo menos três perfis - gestora, triadora e profissional - e restringir funcionalidades conforme o perfil. | Alta |
| RNF003 | Tempo de resposta | O sistema deve responder às consultas de beneficiárias em até três segundos em condições normais de uso. | Média |
| RNF004 | Disponibilidade | O sistema deve estar disponível pelo menos 95% do tempo durante o mês. | Média |
| RNF005 | Responsividade | A interface deve permitir uso adequado em computadores, tablets e smartphones. | Média |
