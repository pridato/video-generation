'use client'

import { FC, useEffect, useState } from 'react'

interface ClientNumberProps {
  value: number
  suffix?: string
}

export const ClientNumber: FC<ClientNumberProps> = ({ value, suffix }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{value}{suffix && ` ${suffix}`}</>
  }

  return <>{value.toLocaleString()}{suffix && ` ${suffix}`}</>
}

