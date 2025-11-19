export const detectLanguage = (sentence) => {
      if(/[\u4e00-\u9fff]/.test(sentence)){
        return 'zh'
    } else if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(sentence)){
      return 'pt'
    } else {
      return 'en'
    }
  }
