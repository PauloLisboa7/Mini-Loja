def adicionar_ao_carrinho(estoque, carrinho, produto, quantidade):
    quantidade_estoque = estoque.get(produto, 0)
    if quantidade > quantidade_estoque:
        print(f"Erro: Não é possível adicionar {quantidade} unidades de {produto}. Estoque disponível: {quantidade_estoque}")
        return
    carrinho[produto] = quantidade
    print(f"{quantidade} unidades de {produto} adicionadas ao carrinho.")

def mostrar_carrinho(carrinho):
    print("Carrinho atual:", carrinho)

def finalizar_compra(estoque, carrinho):
    for produto, quantidade in carrinho.items():
        quantidade_estoque = estoque.get(produto, 0)
        if quantidade > quantidade_estoque:
            print(f"Erro ao finalizar: estoque insuficiente para {produto}. Disponível: {quantidade_estoque}, solicitado: {quantidade}")
            return
    # Diminui o estoque
    for produto, quantidade in carrinho.items():
        estoque[produto] -= quantidade
    print("Obrigado pela compra! Compra finalizada com sucesso.")
    mostrar_carrinho(carrinho)
    print("Estoque atualizado:", estoque)
    carrinho.clear()  # Limpa o carrinho após a compra

# Exemplo de uso:
estoque = {
    "produto1": 7
}

carrinho = {}

adicionar_ao_carrinho(estoque, carrinho, "produto1", 8)  # Deve mostrar erro
mostrar_carrinho(carrinho)
adicionar_ao_carrinho(estoque, carrinho, "produto1", 5)  # Deve adicionar
mostrar_carrinho(carrinho)
finalizar_compra(estoque, carrinho)  # Finaliza a compra e atualiza o estoque