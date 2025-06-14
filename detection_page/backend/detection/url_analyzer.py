def detect_similar_domain(domain: str, full_host: str) -> Union[str, None]:
    domain = domain.lower()
    full_host = full_host.lower()

    if domain in [d.lower() for d in LEGIT_DOMAINS]:
        return None

    host_tokens = re.split(r"[.\-]", full_host)  # 하이픈과 점 기준으로 분해
    for legit in LEGIT_DOMAINS:
        legit = legit.lower()
        legit_base = legit.split('.')[0]  # netflix.com → netflix

        # 예: "netflix" → ["net", "flix"] 조합으로 탐지
        if legit_base in full_host and not domain.endswith(legit):
            return legit

        # 분할된 호스트에 legit 키워드들이 조합된 형태로 존재하는지 확인
        if all(part in host_tokens for part in re.findall(r'\w{3,}', legit_base)):
            return legit

        # 유사도 측정 (기존 방식 유지)
        seq_ratio = SequenceMatcher(None, full_host, legit).ratio()
        lev_dist = levenshtein_distance(full_host, legit)
        jaro_score = jaro_winkler_similarity(full_host, legit)

        if seq_ratio > 0.75 or lev_dist <= 2 or jaro_score > 0.90:
            return legit

    return None
