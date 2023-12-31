export const stylesContent = `
  .fuzzyarea__mirror {
    display: none !important;
  }

  .fuzzyarea__highlight {
    font-weight: bold;
    color: #ff7d00;
  }

  .fuzzyarea__suggestions {
    display: none;
    background-color: white;
    border-radius: 3px;
    color: #393939;
    position: absolute;
    top: calc(100% - 60px);
    left: 0;
    width: 100%;
    z-index: 1;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
    border-bottom: 1px solid #ccc;
  }

  .fuzzyarea__suggestion {
    padding: 0.3rem;
  }

  .fuzzyarea__suggestion:hover {
    background-color: rgba(58, 90, 233, 0.1);
  }

  .fuzzyarea__suggestion--focused {
    color: white;
    background-color: #3858e9;
  }

  .fuzzyarea__suggestion--focused .fuzzyarea__highlight {
    color: #ff9d00;
  }

  .fuzzyarea__suggestion--focused:hover {
    background-color: #3858e9;
  }
`;
