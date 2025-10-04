'use client'

import React, { useRef } from 'react'
import 'css-doodle'

const BackgroundAnimation: React.FC = () => {
  const doodleRef = useRef(null)

  return (
    <div
      ref={doodleRef}
      dangerouslySetInnerHTML={{
        __html: `
          <css-doodle>
            :doodle {
              @grid: 1x8 / 100vmin;
            }
            @place-cell: center;
            width: @rand(40vmin, 60vmin);
            height: @rand(40vmin, 60vmin);
            transform: translate(@rand(-100%, 100%), @rand(-60%, 60%)) scale(@rand(.6, 1.8)) skew(@rand(30deg));
            clip-path: polygon(
              @r(0, 30%) @r(0, 50%), 
              @r(30%, 60%) @r(0%, 30%), 
              @r(60%, 100%) @r(0%, 50%), 
              @r(60%, 100%) @r(50%, 100%), 
              @r(30%, 60%) @r(60%, 100%),
              @r(0, 30%) @r(60%, 100%)
            );
            background: @pick(#f44336, #e91e63, #9c27b0, #673ab7, #3f51b5, #e6437d, #00bcd4, #03a9f4, #2196f3, #009688);
            opacity: @rand(.2, .4);
            position: relative;
            top: @rand(-60%, 60%);
            left: @rand(-60%, 60%);
            animation: colorChange @rand(8s, 20s) infinite @rand(-1s, -3s) linear alternate;
            @keyframes colorChange {
              100% {
                left: 0;
                top: 0;
                filter: hue-rotate(180deg);
              }
            }
          </css-doodle>
        `,
      }}
    />
  )
}

export default BackgroundAnimation