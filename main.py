import streamlit as st
import os
import fitz  # PyMuPDF
from transformers import pipeline
import json
from datetime import datetime

# -----------------------------
# Yükleme ve PDF Metin Çıkarma
# -----------------------------
def extract_text_from_pdfs(uploaded_files):
    all_text = ""
    for file in uploaded_files:
        with fitz.open(stream=file.read(), filetype="pdf") as doc:
            for page in doc:
                all_text += page.get_text()
    return all_text

# -----------------------------
# Özetleme Fonksiyonu
# -----------------------------
def summarize_text(text, chunk_size=1000):
    summarizer = pipeline("summarization", model="csebuetnlp/mT5_multilingual_XLSum")
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    summaries = []
    for chunk in chunks:
        summary = summarizer(chunk, max_length=100, min_length=30, do_sample=False)[0]['summary_text']
        summaries.append(summary)
    return "\n".join(summaries)

# -----------------------------
# Soru Üretme Fonksiyonu
# -----------------------------
def generate_questions(summary):
    question_model = pipeline("text2text-generation", model="iarfmoose/t5-base-question-generator")
    questions = question_model(f"generate questions: {summary}", max_length=256, do_sample=False)[0]['generated_text']
    return questions.split("\n")

# -----------------------------
# Streamlit Arayüzü
# -----------------------------
st.set_page_config(page_title="PDF Özetleme ve Quiz Sistemi", layout="wide")
st.title("📘 PDF Tabanlı Otomatik Özetleme ve Quiz Oluşturucu")

uploaded_files = st.file_uploader("PDF Dosyalarını Yükle", type="pdf", accept_multiple_files=True)

if uploaded_files:
    if st.button("🔍 Metni Çıkar, Özetle ve Soru Üret"):
        with st.spinner("PDF'ler işleniyor..."):
            raw_text = extract_text_from_pdfs(uploaded_files)
            st.subheader("📄 Ham Metin")
            st.text_area("Ham İçerik", raw_text[:2000] + "...", height=200)

            summary = summarize_text(raw_text)
            st.subheader("🧠 Özet")
            st.text_area("Özet", summary, height=300)

            questions = generate_questions(summary)
            st.subheader("❓ Quiz Soruları")
            for i, q in enumerate(questions):
                st.markdown(f"**{i+1}.** {q}")

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            st.download_button("📥 Özeti İndir", summary, file_name=f"ozet_{timestamp}.txt")

            quiz_json = json.dumps({"questions": questions}, indent=4, ensure_ascii=False)
            st.download_button("📥 Quiz Sorularını JSON Olarak İndir", quiz_json, file_name=f"quiz_{timestamp}.json")
