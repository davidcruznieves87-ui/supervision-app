const theme = {

  colors: {

    background: "#F1F5F9",

    sidebar: "#0F172A",

    card: "#FFFFFF",

    primary: "#06B6D4",

    primaryHover: "#0891B2",

    success: "#22C55E",

    error: "#EF4444",

    warning: "#F59E0B",

    text: "#0F172A",

    textLight: "#64748B",

    border: "#E2E8F0",

  },

  layout: {

    page: {

      minHeight: "100vh",

      background:
        "linear-gradient(to bottom right, #F8FAFC, #EEF2FF)",

      padding: "24px",

    },

    content: {

      padding: "10px",

    },

  },

  sidebar: {

    container: {

      width: "240px",

      background:
        "linear-gradient(180deg,#020617,#0F172A)",

      color: "white",

      padding: "24px",

      display: "flex",

      flexDirection: "column",

      gap: "20px",

      borderRight:
        "1px solid rgba(255,255,255,0.06)",

      boxShadow:
        "0 0 30px rgba(0,0,0,0.25)",

    },

    link: {

      color: "#E2E8F0",

      textDecoration: "none",

      padding: "14px 16px",

      borderRadius: "16px",

      background: "rgba(255,255,255,0.04)",

      fontWeight: "700",

      transition: "0.3s",

      border:
        "1px solid rgba(255,255,255,0.04)",

    },

  },

  card: {

    background: "#FFFFFF",

    borderRadius: "28px",

    padding: "24px",

    boxShadow:
      "0 10px 30px rgba(15,23,42,0.08)",

    border:
      "1px solid #E2E8F0",

    marginBottom: "24px",

  },

  button: {

    primary: {

      padding: "14px 22px",

      background:
        "linear-gradient(135deg,#06B6D4,#2563EB)",

      color: "white",

      border: "none",

      borderRadius: "18px",

      cursor: "pointer",

      fontWeight: "800",

      fontSize: "15px",

      boxShadow:
        "0 8px 20px rgba(37,99,235,0.25)",

      transition: "0.3s",

    },

    success: {

      padding: "14px 22px",

      background:
        "linear-gradient(135deg,#22C55E,#16A34A)",

      color: "white",

      border: "none",

      borderRadius: "18px",

      cursor: "pointer",

      fontWeight: "800",

      fontSize: "15px",

      boxShadow:
        "0 8px 20px rgba(34,197,94,0.25)",

      transition: "0.3s",

    },

    danger: {

      padding: "14px 22px",

      background:
        "linear-gradient(135deg,#EF4444,#DC2626)",

      color: "white",

      border: "none",

      borderRadius: "18px",

      cursor: "pointer",

      fontWeight: "800",

      fontSize: "15px",

      boxShadow:
        "0 8px 20px rgba(239,68,68,0.25)",

      transition: "0.3s",

    },

  },

  input: {

    width: "100%",

    padding: "16px",

    borderRadius: "18px",

    border: "1px solid #CBD5E1",

    marginTop: "8px",

    marginBottom: "16px",

    boxSizing: "border-box",

    background: "#FFFFFF",

    fontSize: "15px",

    outline: "none",

    transition: "0.3s",

    boxShadow:
      "0 2px 10px rgba(0,0,0,0.03)",

  },

  title: {

    fontSize: "32px",

    fontWeight: "900",

    color: "#0F172A",

    marginBottom: "24px",

    letterSpacing: "-0.5px",

  },

  message: {

    success: {

      background: "#DCFCE7",

      color: "#166534",

      padding: "16px",

      borderRadius: "18px",

      fontWeight: "800",

      marginBottom: "20px",

      border:
        "1px solid #BBF7D0",

    },

    error: {

      background: "#FEE2E2",

      color: "#991B1B",

      padding: "16px",

      borderRadius: "18px",

      fontWeight: "800",

      marginBottom: "20px",

      border:
        "1px solid #FECACA",

    },

    warning: {

      background: "#FEF3C7",

      color: "#92400E",

      padding: "16px",

      borderRadius: "18px",

      fontWeight: "800",

      marginBottom: "20px",

      border:
        "1px solid #FDE68A",

    },

  },

};

export default theme;