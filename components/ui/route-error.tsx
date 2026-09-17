"use client";import{PageState}from"./page-state";
export function RouteError({reset}:{reset:()=>void}){return <div className="state-wrap"><PageState code="500" title="We could not load this page" message="A server error interrupted the request. Your existing information is safe."/><button className="btn" onClick={reset}>Try again</button></div>}
