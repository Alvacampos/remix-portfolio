const SvgCypress = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 256"
    height="100%"
    role="img"
    {...props}
  >
    <defs>
      <path
        id="cypress_svg__a"
        d="M128 0c70.75 0 128 57.25 128 128s-57.25 128-128 128S0 198.75 0 128 57.25 0 128 0"
      />
      <path
        id="cypress_svg__c"
        d="M128 3c69.09 0 125 55.91 125 125s-55.91 125-125 125S3 197.09 3 128 58.91 3 128 3"
      />
      <filter
        id="cypress_svg__d"
        width="104.8%"
        height="104.8%"
        x="-2.4%"
        y="-2.4%"
        filterUnits="objectBoundingBox"
      >
        <feOffset in="SourceAlpha" result="shadowOffsetOuter1" />
        <feGaussianBlur
          in="shadowOffsetOuter1"
          result="shadowBlurOuter1"
          stdDeviation={2}
        />
        <feColorMatrix
          in="shadowBlurOuter1"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"
        />
      </filter>
    </defs>
    <mask id="cypress_svg__b" fill="#fff">
      <use xlinkHref="#cypress_svg__a" />
    </mask>
    <g mask="url(#cypress_svg__b)">
      <use xlinkHref="#cypress_svg__c" filter="url(#cypress_svg__d)" />
      <use xlinkHref="#cypress_svg__c" fill="#FFF" fillRule="evenodd" />
    </g>
    <path
      fill="#5C5C5E"
      d="M128 7.386c66.667 0 120.614 53.947 120.614 120.614S194.667 248.614 128 248.614 7.386 194.667 7.386 128 61.333 7.386 128 7.386"
      mask="url(#cypress_svg__b)"
    />
    <path
      fill="#FFF"
      d="M192.035 181.07c-4.386 13.597-10.965 23.684-20.175 31.14-9.21 7.457-21.492 11.404-36.842 12.72l-3.07-20.176c10.087-1.315 17.543-3.508 22.368-7.017 1.754-1.316 5.263-5.263 5.263-5.263L123.175 75.807h30.264l21.052 87.28 22.369-87.28h29.386zM86.333 71.86c7.018 0 13.597.877 18.86 3.07 5.702 2.193 10.965 5.263 16.228 9.649l-12.28 16.667c-3.51-2.632-7.018-4.386-10.088-5.702s-7.018-1.755-10.527-1.755c-14.912 0-22.368 11.404-22.368 34.65 0 11.842 1.754 20.175 5.702 25 3.947 5.263 9.21 7.456 16.666 7.456 3.51 0 7.018-.439 10.088-1.755s6.579-3.07 10.965-5.701l12.28 17.543c-10.087 8.334-21.49 12.281-34.648 12.281-10.527 0-19.299-2.193-27.193-6.579-7.457-4.386-13.597-10.965-17.544-19.298s-6.14-17.982-6.14-29.386c0-10.965 2.192-21.053 6.14-29.386 3.947-8.772 10.087-15.35 17.544-20.175 7.456-3.948 16.228-6.58 26.315-6.58"
      mask="url(#cypress_svg__b)"
    />
  </svg>
);
export default SvgCypress;
